# Implementación de Referencia: Django + Supabase

Esta guía contiene los fragmentos de código solicitados para una implementación utilizando **Django** (Python) y **Supabase** (PostgreSQL/Auth).

## 1. Middleware de Límites en Django

```python
# clinical/middleware.py
from django.http import JsonResponse
from .models import UserProfile

class TranscriptionLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Asumiendo que el usuario está autenticado y su perfil está en request.user
        if request.path == '/api/transcriptions/upload/' and request.method == 'POST':
            user_profile = request.user.profile
            
            # Lógica de Negocio sugerida
            if user_profile.subscription == 'Básico' and user_profile.transcription_count >= 10:
                return JsonResponse({
                    'error': 'Has alcanzado el límite de tu plan Básico (10/10).',
                    'code': 'LIMIT_REACHED'
                }, status=403)
                
        return self.get_response(request)
```

## 2. Decorador de Vista (Alternativa al Middleware)

```python
# clinical/decorators.py
from functools import wraps
from django.core.exceptions import PermissionDenied

def check_plan_limit(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        profile = request.user.profile
        if profile.subscription == 'Básico' and profile.transcription_count >= 10:
            raise PermissionDenied("Límite de plan excedido")
        return view_func(request, *args, **kwargs)
    return _wrapped_view
```

## 3. Integración con Supabase (vía supabase-py)

```python
# clinical/services.py
from supabase import create_client, Client
import os

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def get_all_clinical_users():
    # Obtener usuarios desde la tabla de perfiles en Supabase
    response = supabase.table("user_profiles").select("*").execute()
    return response.data

def update_user_status(user_id, role, subscription):
    response = supabase.table("user_profiles").update({
        "role": role,
        "subscription": subscription
    }).eq("id", user_id).execute()
    return response.data
```

## 4. Vista de Administración (Django Rest Framework)

```python
# clinical/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = UserProfile.objects.all().values('id', 'email', 'role', 'subscription', 'transcription_count')
        return Response(users)

    def patch(self, request, pk):
        profile = UserProfile.objects.get(pk=pk)
        profile.role = request.data.get('role', profile.role)
        profile.subscription = request.data.get('subscription', profile.subscription)
        profile.save()
        return Response({"status": "updated"})
```
