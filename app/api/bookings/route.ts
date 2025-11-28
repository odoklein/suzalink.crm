import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geo/geocode";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const campaignId = searchParams.get("campaignId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const approvalStatus = searchParams.get("approvalStatus");
    const sort = searchParams.get("sort"); // 'date', 'proximity'
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const groupBy = searchParams.get("groupBy"); // 'date', 'postalCode'

    const where: any = {};

    // BD users can only see their own bookings
    // Admins and managers can see all
    if (session.user.role === "BD") {
      where.userId = session.user.id;
    } else {
      // Admins/managers can filter by user
      const userId = searchParams.get("userId");
      if (userId) {
        where.userId = userId;
      }
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (campaignId) {
      where.lead = {
        campaignId,
      };
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.startTime = {
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    let orderBy: any = { startTime: "asc" };

    // Proximity sorting (requires lat/lng)
    if (sort === "proximity" && lat && lng) {
      // For proximity sorting, we'll fetch all and sort in memory
      // In production, you'd use PostGIS or a proper spatial index
      const bookings = await prisma.booking.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              standardData: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          meetingType: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
              isPhysical: true,
            },
          },
          approver: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Calculate distance and sort
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const bookingsWithDistance = bookings.map((booking) => {
        if (booking.latitude && booking.longitude) {
          const distance = calculateDistance(
            userLat,
            userLng,
            booking.latitude,
            booking.longitude
          );
          return { ...booking, distance };
        }
        return { ...booking, distance: Infinity };
      });

      bookingsWithDistance.sort((a, b) => a.distance - b.distance);

      // Group by postal code if requested
      if (groupBy === "postalCode") {
        const grouped = groupByPostalCode(bookingsWithDistance);
        return NextResponse.json({ grouped, total: bookingsWithDistance.length });
      }

      return NextResponse.json(bookingsWithDistance);
    }

    // Regular fetch with ordering
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        meetingType: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            isPhysical: true,
          },
        },
        approver: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy,
    });

    // Group by date if requested
    if (groupBy === "date") {
      const grouped = groupByDate(bookings);
      return NextResponse.json({ grouped, total: bookings.length });
    }

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      leadId,
      meetingTypeId,
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      reminders,
      contactName,
      contactEmail,
      contactPhone,
      address,
      postalCode,
      city,
      onlineMeetingEmail,
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Determine if meeting is physical based on meeting type
    let isPhysical = false;
    let meetingTypeData = null;

    if (meetingTypeId) {
      meetingTypeData = await prisma.campaignMeetingType.findUnique({
        where: { id: meetingTypeId },
      });
      isPhysical = meetingTypeData?.isPhysical || false;
    }

    // Validate required fields based on meeting type
    if (isPhysical && !address) {
      return NextResponse.json(
        { error: "Address is required for physical meetings" },
        { status: 400 }
      );
    }

    // Geocode address for physical meetings
    let latitude: number | null = null;
    let longitude: number | null = null;
    let geocodedPostalCode: string | null = postalCode || null;
    let geocodedCity: string | null = city || null;
    let geocodedAddress: string | null = address || null;

    if (isPhysical && address) {
      try {
        const fullAddress = [address, city, postalCode].filter(Boolean).join(", ");
        const geocodeResult = await geocodeAddress(fullAddress);
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        geocodedPostalCode = geocodeResult.postalCode || postalCode || null;
        geocodedCity = geocodeResult.city || city || null;
        geocodedAddress = geocodeResult.address || address || null;
      } catch (error: any) {
        console.error("Geocoding error:", error?.message || error);
        // Continue without geocoding if it fails
      }
    }

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ["scheduled", "confirmed"],
        },
        approvalStatus: {
          not: "rejected",
        },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Time slot conflict",
          conflicts: conflicts.map((b) => ({
            id: b.id,
            title: b.title,
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        },
        { status: 409 }
      );
    }

    // Determine approval status based on user role
    // BDs create bookings as "on_hold", Admins/Managers create as "approved"
    const approvalStatus = session.user.role === "BD" ? "on_hold" : "approved";
    const approvedBy = session.user.role !== "BD" ? session.user.id : null;
    const approvedAt = session.user.role !== "BD" ? new Date() : null;

    // Build booking data
    const bookingData: any = {
      userId: session.user.id,
      leadId: leadId || null,
      meetingTypeId: meetingTypeId || null,
      title,
      description: description || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location: location || null,
      status: "scheduled",
      approvalStatus,
      approvedBy,
      approvedAt,
      attendees: attendees || null,
      reminders: reminders || null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      address: geocodedAddress,
      postalCode: geocodedPostalCode,
      city: geocodedCity,
      latitude,
      longitude,
      onlineMeetingEmail: onlineMeetingEmail || null,
    };

    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
          },
        },
        meetingType: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    // Log activity if linked to a lead
    if (leadId) {
      await prisma.activityLog.create({
        data: {
          leadId,
          userId: session.user.id,
          type: "NOTE",
          metadata: {
            note: `Meeting scheduled: ${title}`,
            bookingId: booking.id,
            startTime: booking.startTime,
            approvalStatus,
          },
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper function to group bookings by date
function groupByDate(bookings: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const booking of bookings) {
    const dateKey = new Date(booking.startTime).toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(booking);
  }

  return grouped;
}

// Helper function to group bookings by postal code
function groupByPostalCode(bookings: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const booking of bookings) {
    const key = booking.postalCode || "unknown";
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(booking);
  }

  return grouped;
}
