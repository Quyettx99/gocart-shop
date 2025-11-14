import { clerkClient } from "@clerk/nextjs/server";

const authAdmin = async(userId) =>{
    try {
        if(!userId)
            return false;

        const rawAdminEmails = process.env.ADMIN_EMAIL || ""
        const adminEmails = rawAdminEmails
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean)

        if(adminEmails.length === 0)
            return false

        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()

        if(!userEmail)
            return false

        return adminEmails.includes(userEmail)
    } catch (error) {
        console.error(error)
        return false
    }
}

export default authAdmin;