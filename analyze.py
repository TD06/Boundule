import requests
from time import sleep
import pandas as pd
import sys

API_key = "1b59c8a6d42f449a97c9cd54fc78eecc"

def analyze_audio(file_url):
    headers = {
        'authorization': API_key,
        'content-type': 'application/json',
    }

    upload_endpoint = 'https://api.assemblyai.com/v2/upload'

    def read_file(url):
        response = requests.get(url, stream=True)
        for chunk in response.iter_content(chunk_size=5_242_880):
            if chunk: 
                yield chunk

    res_upload = requests.post(upload_endpoint, headers=headers, data=read_file(file_url))

    upload_url = res_upload.json().get('upload_url')

    transcript_endpoint = "https://api.assemblyai.com/v2/transcript"

    json = {
        "audio_url": upload_url,
        "sentiment_analysis": True,
        "speaker_labels": True
    }

    response = requests.post(transcript_endpoint, json=json, headers=headers)
    response_id = response.json()['id']

    endpoint = f"https://api.assemblyai.com/v2/transcript/{response_id}"

    current_status = "queued"
    while current_status not in ("completed", "error"):
        response = requests.get(endpoint, headers=headers)
        current_status = response.json()['status']
        if current_status not in ("completed", "error"):
            sleep(10)

    sent_data = []
    for idx, sentence in enumerate(response.json()["sentiment_analysis_results"]):
        sent = sentence["text"]
        sentiment = sentence["sentiment"]
      
       
        sent_data.append([idx + 1, sent , sentiment])

    sent_data = pd.DataFrame(sent_data, columns=["SentenceID", "Text", "Sentiment"])
    return sent_data.to_json(orient='records')

if __name__ == "__main__":
    file_url = sys.argv[1]
    result = analyze_audio(file_url)
    print(result)
