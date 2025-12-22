export interface Project {
    id: number
    userId: number
    name: string
    description: string | null
    startDate: Date | null
    endDate: Date | null
    budget: number | null
    status: string  // 'planning' | 'active' | 'completed' | 'archived'
    color: string | null
    createdAt: Date
    updatedAt: Date
}

export interface ProjectWithLocations extends Project {
    owner?: {
        id: number
        username: string
        email: string
    }
    locations?: ProjectLocation[]
}

export interface ProjectLocation {
    id: number
    projectId: number
    locationId: number
    shootDate: Date | null
    notes: string | null
    addedAt: Date
}

export interface LocationContact {
    id: number
    locationId: number
    name: string
    role: string | null  // 'Owner' | 'Manager' | 'Security'
    email: string | null
    phone: string | null
    notes: string | null
    createdAt: Date
}

export interface TeamMember {
    id: number
    userId: number
    invitedBy: number
    role: string  // 'viewer' | 'editor' | 'admin'
    joinedAt: Date
}

export interface TeamMemberWithUser extends TeamMember {
    user: {
        id: number
        username: string
        email: string
        firstName: string | null
        lastName: string | null
    }
    inviter: {
        id: number
        username: string
        email: string
    }
}

// Request types
export interface CreateProjectRequest {
    name: string
    description?: string
    startDate?: string | Date
    endDate?: string | Date
    budget?: number
    status?: string
    color?: string
}

export interface UpdateProjectRequest {
    name?: string
    description?: string
    startDate?: string | Date
    endDate?: string | Date
    budget?: number
    status?: string
    color?: string
}

export interface AddLocationToProjectRequest {
    locationId: number
    shootDate?: string | Date
    notes?: string
}

export interface CreateLocationContactRequest {
    locationId: number
    name: string
    role?: string
    email?: string
    phone?: string
    notes?: string
}

export interface InviteTeamMemberRequest {
    userId: number
    role?: 'viewer' | 'editor' | 'admin'
}
