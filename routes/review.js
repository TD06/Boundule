const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const expressError = require("../utils/expressError.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const Listing = require("../models/listing.js");
const {validateReview, isLoggedIn,isReviewAuthor} = require("../middleware.js");
const reviewController = require("../contollers/review.js");



//Post Route
router.post("/" , isLoggedIn , validateReview, wrapAsync(reviewController.createReview));
  
  
//Delete Route
  
router.delete("/:reviewId" ,isLoggedIn,isReviewAuthor , wrapAsync(reviewController.deleteReview))

  module.exports = router;