from rest_framework import serializers


class VersionedPackageSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    description = serializers.CharField(required=True, allow_null=True)
    version = serializers.CharField()
    dependencies = serializers.DictField(child=serializers.CharField())
