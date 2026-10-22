from django.contrib import admin

from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'owner', 'acquired_at']
    list_filter = ['edition__release']
