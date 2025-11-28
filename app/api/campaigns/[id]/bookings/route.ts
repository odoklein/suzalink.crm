import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "date";
    const proximityMode = searchParams.get("proximityMode") || "postal_code";
    const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : null;
    const referenceLat = searchParams.get("referenceLat") ? parseFloat(searchParams.get("referenceLat")!) : null;
    const referenceLng = searchParams.get("referenceLng") ? parseFloat(searchParams.get("referenceLng")!) : null;
    const meetingType = searchParams.get("meetingType");

    // Build where clause
    const where: any = {
      lead: {
        campaignId,
      },
      status: {
        in: ["scheduled", "confirmed"],
      },
    };

    // Date filtering
    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) {
        where.startTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.startTime.lte = new Date(dateTo);
      }
    }

    // Meeting type filtering
    if (meetingType && (meetingType === "PHYSICAL" || meetingType === "ONLINE")) {
      where.meetingType = meetingType;
    }

    // Get all bookings for leads in this campaign
    let bookings = await prisma.booking.findMany({
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
      },
    });

    // Calculate distances if proximity sorting is requested
    if (sortBy === "proximity" && referenceLat && referenceLng) {
      bookings = bookings.map((booking) => {
        let distance: number | null = null;
        if (booking.latitude && booking.longitude) {
          distance = calculateDistance(
            referenceLat,
            referenceLng,
            booking.latitude,
            booking.longitude
          );
        }
        return { ...booking, distance };
      });

      // Sort by distance (closest first)
      bookings.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      // Filter by radius if specified
      if (radius !== null) {
        bookings = bookings.filter((booking) => {
          if (booking.distance === null) return false;
          return booking.distance <= radius;
        });
      }
    } else {
      // Default sorting by date
      bookings.sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
    }

    // Group by postal code or proximity clusters
    let groupedByCP: Record<string, typeof bookings> = {};
    
    if (proximityMode === "postal_code") {
      groupedByCP = bookings.reduce((acc, booking) => {
        const cp = booking.postalCode || "Non renseigné";
        if (!acc[cp]) {
          acc[cp] = [];
        }
        acc[cp].push(booking);
        return acc;
      }, {} as Record<string, typeof bookings>);
    } else if (proximityMode === "radius" && radius !== null && referenceLat && referenceLng) {
      // Group by proximity clusters (within radius)
      const clusters: typeof bookings[] = [];
      const processed = new Set<string>();

      bookings.forEach((booking) => {
        if (processed.has(booking.id)) return;
        if (!booking.latitude || !booking.longitude) {
          // Bookings without coordinates go to "Non localisé"
          if (!groupedByCP["Non localisé"]) {
            groupedByCP["Non localisé"] = [];
          }
          groupedByCP["Non localisé"].push(booking);
          processed.add(booking.id);
          return;
        }

        const cluster = [booking];
        processed.add(booking.id);

        // Find nearby bookings
        bookings.forEach((other) => {
          if (processed.has(other.id)) return;
          if (!other.latitude || !other.longitude) return;

          const dist = calculateDistance(
            booking.latitude!,
            booking.longitude!,
            other.latitude!,
            other.longitude!
          );

          if (dist <= radius) {
            cluster.push(other);
            processed.add(other.id);
          }
        });

        const clusterKey = `Cluster ${clusters.length + 1} (${cluster.length} RDV)`;
        groupedByCP[clusterKey] = cluster;
        clusters.push(cluster);
      });
    } else {
      // Default: group by postal code
      groupedByCP = bookings.reduce((acc, booking) => {
        const cp = booking.postalCode || "Non renseigné";
        if (!acc[cp]) {
          acc[cp] = [];
        }
        acc[cp].push(booking);
        return acc;
      }, {} as Record<string, typeof bookings>);
    }

    return NextResponse.json({
      bookings,
      groupedByCP,
      total: bookings.length,
    });
  } catch (error) {
    console.error("Error fetching campaign bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
