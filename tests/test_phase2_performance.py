import pytest
from backend.performance import (
    detect_image_format,
    is_served_by_cdn,
    calculate_image_savings,
    run_synthetic_or_live_perf_analysis,
)

def test_detect_image_format():
    assert detect_image_format("https://example.com/logo.webp") == "WEBP"
    assert detect_image_format("https://example.com/photo.avif") == "AVIF"
    assert detect_image_format("https://example.com/hero.jpg") == "JPEG"
    assert detect_image_format("https://example.com/icon.svg") == "SVG"
    assert detect_image_format("https://example.com/blob", "image/png") == "PNG"


def test_is_served_by_cdn():
    assert is_served_by_cdn("https://images.cloudflare.com/img1.jpg") is True
    assert is_served_by_cdn("https://d123.cloudfront.net/banner.png") is True
    assert is_served_by_cdn("https://res.cloudinary.com/demo/image.webp") is True
    assert is_served_by_cdn("https://raw-personal-server.com/photo.jpg") is False


def test_calculate_image_savings():
    # Small image: no savings needed
    assert calculate_image_savings(5000, "PNG", 100, 100, 100, 100) == 0

    # Large legacy PNG: modern format savings ~45%
    savings = calculate_image_savings(200_000, "PNG", 400, 400, 400, 400)
    assert savings > 50_000

    # Oversized image: natural width 1000px vs displayed 200px
    oversized_savings = calculate_image_savings(300_000, "JPEG", 1000, 1000, 200, 200)
    assert oversized_savings > 100_000
