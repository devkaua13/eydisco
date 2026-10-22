from django.urls import path

from . import views

urlpatterns = [
    path('<str:username>/shelf/', views.ShelfView.as_view(), name='shelf'),
]
