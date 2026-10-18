import json
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt  # 1. Import this
from google import genai

def index(request):
    return render(request, 'index.html')

@csrf_exempt  
def chat_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt', '').strip()

            if not prompt:
                return JsonResponse({'error': 'Prompt cannot be empty.'}, status=400)

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-3.5-flash-lite',
                contents=prompt
            )

            return JsonResponse({'response': response.text})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)