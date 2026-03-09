# Database Schema — Source of Truth

All tables use UUIDs as primary keys. All timestamps are UTC.
`property_id` is present on nearly every table — multi-tenancy from day one.

**Rule: change this file first, then change the code.**

---

## Core Entities

properties
├── id (uuid, pk)
├── name
├── slug (unique, used in booking engine URLs)
├── description
├── address, city, country
├── currency (default "EUR")
├── timezone (default "Europe/Zagreb")
├── check_in_time (time)
├── check_out_time (time)
├── deposit_percentage (int, default 30, used by Stripe logic)
├── payment_mode (full_at_booking | deposit_at_booking | scheduled)
├── scheduled_charge_threshold_days (int, default 7)
├── cancellation_policy (flexible | moderate | strict)
├── cancellation_deadline_days (int, default 7)
├── status (active | inactive)
├── stripe_account_id (nullable, for Stripe Connect)
├── api_key (unique, for REST API auth)
├── tagline (text, nullable — short marketing line shown in booking engine)
├── phone (varchar, nullable — contact phone for guests)
├── email (varchar, nullable — contact email for guests)
├── logo_url (text, nullable — full URL to property logo image)
├── maps_url (text, nullable — Google Maps or similar link)
├── latitude (real, nullable — WGS84 latitude for JSON-LD geo)
├── longitude (real, nullable — WGS84 longitude for JSON-LD geo)
├── check_in_instructions (text, nullable — shown in pre-arrival email)
├── website_url (text, nullable — property website)
├── created_at
└── updated_at

room_types
├── id (uuid, pk)
├── property_id (fk → properties)
├── name (e.g. "Double Sea View")
├── slug
├── description
├── base_occupancy
├── max_occupancy
├── base_rate_cents (default nightly rate in cents)
├── sort_order
├── status (active | inactive)
├── created_at
└── updated_at

rooms
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── room_number (e.g. "101", "A2")
├── floor (nullable)
├── status (available | maintenance | out_of_service)
├── created_at
└── updated_at

rate_plans
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── name (e.g. "Summer 2026", "Early Bird")
├── type (seasonal | length_of_stay | occupancy)
├── date_start (date, nullable)
├── date_end (date, nullable)
├── min_nights (nullable)
├── rate_cents (overrides base_rate_cents when active)
├── priority (higher number wins on overlap)
├── status (active | inactive)
├── created_at
└── updated_at

inventory
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── date (date)
├── total_units (int)
├── booked_units (int, default 0)
├── blocked_units (int, default 0)
├── rate_override_cents (nullable, per-date manual price)
├── created_at
└── updated_at
UNIQUE: (property_id, room_type_id, date)
Available = total_units - booked_units - blocked_units

guests
├── id (uuid, pk)
├── property_id (fk → properties)
├── email
├── first_name
├── last_name
├── phone (nullable)
├── country (nullable)
├── notes (nullable)
├── total_stays (int, default 0)
├── total_spent_cents (int, default 0)
├── created_at
└── updated_at
UNIQUE: (property_id, email)

reservations
├── id (uuid, pk)
├── property_id (fk → properties)
├── guest_id (fk → guests)
├── confirmation_code (unique, e.g. "SHP-A7K2M")
├── check_in (date)
├── check_out (date)
├── nights (int)
├── adults (int)
├── children (int, default 0)
├── status (pending | confirmed | checked_in | checked_out | cancelled | no_show)
├── channel (direct | booking_com | airbnb | expedia | walk_in | phone)
├── total_cents (int)
├── currency
├── special_requests (text, nullable)
├── manage_token (varchar, unique, nullable — guest portal access)
├── checkout_started_at (timestamp, nullable — set when payment flow begins, M14)
├── cancelled_at (nullable)
├── cancellation_reason (nullable)
├── created_at
└── updated_at

reservation_rooms
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── room_type_id (fk → room_types)
├── room_id (fk → rooms, nullable — assigned at check-in)
├── rate_per_night_cents (locked at booking time)
├── created_at
└── updated_at

payments
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── property_id (fk → properties)
├── stripe_payment_intent_id (nullable)
├── stripe_setup_intent_id (nullable — scheduled flow)
├── stripe_payment_method_id (nullable — scheduled flow)
├── stripe_customer_id (nullable — scheduled flow)
├── type (deposit | full_payment | refund)
├── amount_cents (int)
├── currency
├── status (pending | requires_capture | captured | failed | refunded)
├── scheduled_charge_at (timestamp, nullable — when to charge saved card)
├── charge_attempts (int, default 0)
├── captured_at (nullable)
├── refunded_at (nullable)
├── created_at
└── updated_at

review_tokens
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── property_id (fk → properties)
├── token (unique, random string)
├── expires_at (30 days after checkout)
├── used_at (nullable)
├── created_at
└── updated_at

reviews
├── id (uuid, pk)
├── property_id (fk → properties)
├── reservation_id (fk → reservations, nullable — null for OTA reviews)
├── guest_id (fk → guests, nullable — null for OTA reviews)
├── review_token_id (fk → review_tokens, nullable — null for OTA reviews)
├── rating (int, 1-5, normalized)
├── title (nullable)
├── body (text)
├── reviewer_name (text, nullable — used for OTA reviews without guest record)
├── stay_date_start (date)
├── stay_date_end (date)
├── status (pending | published | hidden)
├── source (enum: direct | booking_com | google | tripadvisor | airbnb | expedia, default 'direct')
├── external_id (varchar(255), nullable — deduplication key for OTA imports)
├── source_url (text, nullable — link to original review on OTA platform)
├── source_rating_raw (real, nullable — original scale rating, e.g. 9.2 for Booking.com)
├── property_response (nullable)
├── property_responded_at (nullable)
├── created_at
└── updated_at
UNIQUE: (property_id, external_id) when external_id is not null

users
├── id (uuid, pk)
├── property_id (fk → properties)
├── email
├── name
├── role (owner | manager | front_desk)
├── created_at
└── updated_at

email_logs
├── id (uuid, pk)
├── reservation_id (fk → reservations)
├── property_id (fk → properties)
├── type (confirmation | pre_arrival | post_stay | review_request | cancellation)
├── recipient_email
├── subject
├── status (sent | failed)
├── sent_at
├── created_at
└── updated_at

amenities
├── id (uuid, pk)
├── property_id (fk → properties)
├── name (e.g. "Free Wi-Fi")
├── slug (e.g. "wifi")
├── icon (Lucide icon name, e.g. "wifi")
├── sort_order (int)
├── created_at
└── updated_at
UNIQUE: (property_id, slug)

room_type_amenities
├── room_type_id (fk → room_types, cascade delete)
├── amenity_id (fk → amenities, cascade delete)
PRIMARY KEY: (room_type_id, amenity_id)

booking_rules
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types)
├── min_nights (int, nullable)
├── max_nights (int, nullable)
├── allowed_check_in_days (int[], nullable — 0=Sun..6=Sat, null means all days)
├── allowed_check_out_days (int[], nullable)
├── date_start (date, nullable — null means always active)
├── date_end (date, nullable)
├── created_at
└── updated_at

discounts
├── id (uuid, pk)
├── property_id (fk → properties)
├── room_type_id (fk → room_types, nullable — null means all room types)
├── name (e.g. "Early Bird", "Summer Special")
├── percentage (int, 1–100)
├── date_start (date, nullable)
├── date_end (date, nullable)
├── status (active | inactive)
├── created_at
└── updated_at
