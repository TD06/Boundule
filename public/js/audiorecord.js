let mediaRecorder;
        let audioChunks = [];

        document.getElementById('recordButton').addEventListener('click', async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = document.getElementById('audioPlayback');
                audio.src = audioUrl;
                document.getElementById('uploadButton').disabled = false;

                document.getElementById('uploadButton').addEventListener('click', async () => {
                    try {
                        const formData = new FormData();
                        formData.append('audio', audioBlob, 'recording.mp3');
                        let {id} = listingId;
                        const response = await fetch(`/listings/${id}/uploads`, {
                            method: 'POST',
                            body: formData
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const data = await response.json();
                        document.getElementById('fileLink').innerHTML = `<a href="${data.link}" target="_blank">View and Edit File</a>`;

                        const sentimentHtml = data.sentiment.map(item => {
                            return `<p>Sentence: ${item.Text}<br>Sentiment: ${item.Sentiment}</p>`;
                        }).join("");

                        document.getElementById('sentimentResults').innerHTML = `<h2>Sentiment Analysis Results:</h2>${sentimentHtml}`;

                    } catch (error) {
                        console.error('Error:', error);
                        document.getElementById('fileLink').innerText = `Error: ${error.message}`;
                    }
                });
            });

            document.getElementById('stopButton').disabled = false;
            document.getElementById('recordButton').disabled = true;
        });

        document.getElementById('stopButton').addEventListener('click', () => {
            mediaRecorder.stop();
            document.getElementById('stopButton').disabled = true;
            document.getElementById('recordButton').disabled = false;
        });