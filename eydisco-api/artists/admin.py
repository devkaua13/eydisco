from django.contrib import admin

from .models import Artist


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ['name']}
    search_fields = ['name']
    filter_horizontal = ['managers', 'followers']
