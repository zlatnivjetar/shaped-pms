import type { Property, RoomType } from "@/db/schema";

interface Amenity {
  name: string;
}

export function buildLodgingBusinessJsonLd(
  property: Property,
  roomTypes: RoomType[],
  amenities: Amenity[],
  baseUrl: string
): Record<string, unknown> {
  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressLocality: property.city ?? undefined,
    addressCountry: property.country ?? undefined,
    streetAddress: property.address ?? undefined,
  };

  const lodgingBusiness: Record<string, unknown> = {
    "@type": "LodgingBusiness",
    name: property.name,
    url: property.websiteUrl ?? `${baseUrl}/${property.slug}`,
    address,
  };

  if (property.description) {
    lodgingBusiness.description = property.description;
  }

  if (property.logoUrl) {
    lodgingBusiness.image = property.logoUrl;
    lodgingBusiness.logo = property.logoUrl;
  }

  if (property.phone) {
    lodgingBusiness.telephone = property.phone;
  }

  if (property.email) {
    lodgingBusiness.email = property.email;
  }

  if (property.latitude != null && property.longitude != null) {
    lodgingBusiness.geo = {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  if (property.mapsUrl) {
    lodgingBusiness.hasMap = property.mapsUrl;
  }

  if (property.checkInTime) {
    lodgingBusiness.checkinTime = property.checkInTime;
  }

  if (property.checkOutTime) {
    lodgingBusiness.checkoutTime = property.checkOutTime;
  }

  if (amenities.length > 0) {
    lodgingBusiness.amenityFeature = amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.name,
      value: true,
    }));
  }

  if (roomTypes.length > 0) {
    lodgingBusiness.containsPlace = roomTypes.map((rt) => {
      const accommodation: Record<string, unknown> = {
        "@type": "Accommodation",
        name: rt.name,
        occupancy: {
          "@type": "QuantitativeValue",
          minValue: rt.baseOccupancy,
          maxValue: rt.maxOccupancy,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: property.currency,
          price: (rt.baseRateCents / 100).toFixed(2),
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: (rt.baseRateCents / 100).toFixed(2),
            priceCurrency: property.currency,
            unitText: "NIGHT",
          },
        },
      };

      if (rt.description) {
        accommodation.description = rt.description;
      }

      return accommodation;
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [lodgingBusiness],
  };
}
