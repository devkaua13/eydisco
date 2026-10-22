from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class MeSerializer(UserSerializer):
    """O usuário logado, com os artistas que ele gerencia (para criar House de artista)."""

    managed_artists = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = [*UserSerializer.Meta.fields, 'managed_artists']

    def get_managed_artists(self, user):
        return [{'name': a.name, 'slug': a.slug} for a in user.managed_artists.all()]
