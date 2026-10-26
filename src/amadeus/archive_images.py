"""Versioned portrait metadata; only these bundled paths may enter records."""
import json
from pathlib import Path

CHARACTER_IMAGES = json.loads(
    (Path(__file__).parent / "resources/character_images.json").read_text(encoding="utf-8")
)
ARCHIVE_IMAGE_PATHS = frozenset({
    "", "/assets/kurisu-account.jpg", "/runtime/branding/logo.webp",
    *(image["src"] for image in CHARACTER_IMAGES.values()),
})


def attach_character_images(pages):
    journeys = {"kurisu-journey": "makise-kurisu", "okabe-journey": "okabe-rintaro",
                "mayuri-journey": "mayuri-shiina", "daru-journey": "hashida-itaru",
                "maho-journey": "hiyajo-maho"}
    for page in pages:
        person = journeys.get(page["slug"], page["slug"])
        image = CHARACTER_IMAGES.get(person)
        if image:
            page["image"] = image["src"]
            page["sources"].append({"title": image["title"], "url": image["source"],
                                    "locator": image["locator"]})
        elif person == "makise-kurisu":
            page["image"] = "/assets/kurisu-account.jpg"
