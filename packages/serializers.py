from rest_framework import serializers
from rest_framework_recursive.fields import RecursiveField


class PackageSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    version = serializers.CharField()
    dependencies = serializers.ListSerializer(child=RecursiveField())
