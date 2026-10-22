from django.urls import path

from . import views

urlpatterns = [
    path('feed/', views.FeedView.as_view(), name='feed'),
    path('releases/<slug:slug>/', views.ReleaseDetailView.as_view(), name='release-detail'),
    path('tracks/<slug:slug>/', views.TrackDetailView.as_view(), name='track-detail'),
    path('search/', views.SearchView.as_view(), name='search'),
]
