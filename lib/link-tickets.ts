// lib/link-tickets.ts
import { Registration, Ticket } from "@/models";

/**
 * After a user account is created, scan for any team-registration tickets
 * that were left unlinked because the member had no account at payment time.
 *
 * Tickets are created in the same order as Registration.teamMembers[], so we
 * match by position: ticket[N] belongs to teamMembers[N].
 */
export async function linkUnclaimedTickets(email: string, userId: string): Promise<number> {
    const registrations = await Registration.find({
        "teamMembers.email": email,
    }).lean();

    let linked = 0;

    for (const reg of registrations) {
        const memberIndex = (reg as any).teamMembers.findIndex(
            (m: any) => m.email === email
        );
        if (memberIndex === -1) continue;

        // Fetch all member tickets for this registration in creation order
        const memberTickets = await Ticket.find({
            registrationId: reg._id,
            teamRole: "member",
        })
            .sort({ _id: 1 })
            .lean();

        const ticket = memberTickets[memberIndex];
        if (!ticket) continue;

        // Only link if not already linked to someone
        if (ticket.userId) continue;

        await Ticket.findByIdAndUpdate(ticket._id, { userId });
        linked++;
    }

    return linked;
}
