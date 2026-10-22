from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('token/', obtain_auth_token, name='token'),
    path('me/', views.MeView.as_view(), name='me'),
]
