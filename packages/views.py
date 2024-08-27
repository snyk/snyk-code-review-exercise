import asyncio
import logging

import aiohttp
from rest_framework import renderers, views, status
from rest_framework.request import Request
from rest_framework.response import Response
import requests

from packages.modules import npm
from packages.serializers import PackageSerializer


class PackageView(views.APIView):
    renderer_classes = [renderers.JSONRenderer]

    def get(self, request: Request, package_name: str, range: str | None = "*"):
        try:
            package_info = asyncio.run(npm.get_package(package_name, range))
            serializer = PackageSerializer(package_info)
            return Response(serializer.data)
        except aiohttp.ClientResponseError as http_err:
            return Response({"error": str(http_err)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as err:
            logging.exception(err)
            return Response(
                {"error": "Internal API error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
