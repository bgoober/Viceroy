import json
import requests

API_TOKEN = "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"

headers = {"Authorization": f"Bearer {API_TOKEN}"}

API_URL = "https://api-inference.huggingface.co/models/mediabiasgroup/roberta_mtl_media_bias"

def query(payload):
    data = json.dumps(payload)
    response = requests.request("POST", API_URL, headers=headers, data=data)
    return print(json.loads(response.content.decode("utf-8")))


data = query(input())