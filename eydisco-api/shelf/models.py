from django.conf import settings
from django.db import models


class Item(models.Model):
    """Um exemplar de uma Edition na Estante de um usuário, ex.: #23/500."""

    edition = models.ForeignKey('releases.Edition', on_delete=models.PROTECT, related_name='items')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='items')
    serial_number = models.PositiveIntegerField()
    acquired_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-acquired_at']
        constraints = [
            models.UniqueConstraint(fields=['edition', 'serial_number'], name='unique_serial_per_edition'),
        ]

    def __str__(self):
        return f'{self.edition} #{self.serial_number}/{self.edition.total_supply}'
