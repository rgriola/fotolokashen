export interface Photo {
    id: number
    placeId: string
    userId: number | null

    // ImageKit fields
    imagekitFileId: string
    imagekitFilePath: string
    originalFilename: string | null

    // File metadata
    fileSize: number | null
    mimeType: string | null
    width: number | null
    height: number | null

    // Photo properties
    isPrimary: boolean
    caption: string | null

    // Timestamps
    uploadedAt: Date
}

export interface PhotoWithUploader extends Photo {
    uploader?: {
        id: number
        username: string
        email: string
    } | null
}

export interface UploadPhotoRequest {
    placeId: string
    imagekitFileId: string
    imagekitFilePath: string
    originalFilename?: string
    fileSize?: number
    mimeType?: string
    width?: number
    height?: number
    isPrimary?: boolean
    caption?: string
}

export interface UpdatePhotoRequest {
    isPrimary?: boolean
    caption?: string
}
