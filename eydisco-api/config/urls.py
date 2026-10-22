from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

from accounts.views import ProfileView

from .media import serve_media

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/artists/', include('artists.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/users/<str:username>/', ProfileView.as_view(), name='profile'),
    path('api/users/', include('shelf.urls')),
    path('api/radio/', include('radio.urls')),
    path('api/houses/', include('houses.urls')),
    path('api/', include('discovery.urls')),
    path('api/', include('releases.urls')),
]

# Sem bucket configurado, a própria API serve o /media/ (com Range, para o player).
if not settings.USE_S3:
    urlpatterns.append(re_path(r'^media/(?P<path>.*)$', serve_media))
