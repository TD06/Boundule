if(process.env.NODE_ENV != "production"){
  require('dotenv').config();

}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const engine = require("ejs-mate");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const atlasUrl = process.env.MONGO_TOKEN;
const wrapAsync = require("./utils/wrapAsync.js");
const expressError = require("./utils/expressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');

const { exec } = require('child_process');


const upload = multer({ dest: 'uploads/' });

const CLIENT_ID = '1039609089231-fjaai67fkp49vk629qqvt4anekglji8u.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04QPE2yAlff0DCgYIARAAGAQSNwF-L9IrOxUFjn--s_a6NG4auO1CsVmgYpcCua1js_wFgNPBb86jrK12hqDd3C6oISiWM_P1c3o';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.use(express.json());



app.post('/listings/:id/uploads', upload.single('audio'), async (req, res) => {
    const filePath = path.join(__dirname, req.file.path);

    try {
        const response = await drive.files.create({
            requestBody: {
                name: 'recording.mp3',
                mimeType: 'audio/mp3',
            },
            media: {
                mimeType: 'audio/mp3',
                body: fs.createReadStream(filePath),
            },
        });

        const fileId = response.data.id;

        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'writer',
                type: 'anyone',
            },
        });

        const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

        exec(`python analyze.py "${downloadLink}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                res.status(500).json({ error: 'Error analyzing file' });
                return;
            }

            try {
                const sentimentData = JSON.parse(stdout);
                res.json({ link: downloadLink, sentiment: sentimentData });
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                res.status(500).json({ error: 'Error parsing sentiment analysis results' });
            }
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    } finally {
        fs.unlinkSync(filePath);
    }
});
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(atlasUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs" , engine);
app.use(express.static(path.join(__dirname , "/public" )));
const store = MongoStore.create({
  mongoUrl: atlasUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24*3600,
});
store.on("error" , ()=>{
  console.log("Error in MONGO session store");
});
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};


app.use(session(sessionOptions));
app.use(flash());

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });



app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


app.use("/listings" , listingRouter);
app.use("/listings/:id/reviews" , reviewRouter);
app.use("/" , userRouter);

app.all("*" , (res,req,next)=>{
  next(new expressError(404, "Page not found!!"));
});

app.use((err,req,res,next) =>{
  let {statusCode =500 , message = "Something went wrong!"} = err;
  res.status(statusCode).render("error.ejs",{message});
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});