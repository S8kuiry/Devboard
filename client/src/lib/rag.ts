

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || ""
    return { Authorization: `Bearer ${token}` }

}


export interface IngestResult {
    filename: string
    chunks_ingested: number
    status: string
}

export async function ingestDocument(
    file: File,
    namespace: string,
    aiUrl: string,
    signal?: AbortSignal
): Promise<IngestResult> {
    const trimmedNamespace = namespace?.trim()
    if (!trimmedNamespace) {
        throw new Error('Upload failed: Missing document namespace')
    }

    const formData = new FormData()
    formData.append('namespace', trimmedNamespace)
    formData.append('file', file)

    const res = await fetch(`${aiUrl}/rag/ingest`, {
        method: "POST",
        // Do NOT set Content-Type here — the browser sets the multipart
        // boundary automatically for FormData. Setting it manually breaks the upload.
        headers: getAuthHeaders(),
        body: formData,
        signal,
    })

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const errorMessage = typeof body.detail === 'string'
            ? body.detail
            : (Array.isArray(body.detail) && body.detail[0]?.msg ? body.detail[0].msg : null)
        throw new Error(errorMessage || `Upload failed (${res.status})`)
    }

    return res.json()


}



export const deleteDocument = async (
    namespace: string,
    source: string,
    aiUrl: string
) => {

    const res = await fetch(`${aiUrl}/rag/document`, {
        method: "DELETE",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        }, body: JSON.stringify({ namespace, source })

    })
    if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to delete document')
    }

    return await res.json()

}


export const discardDraft = async (draftId: string, aiUrl: string) => {
    const res = await fetch(`${aiUrl}/rag/draft/${draftId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to discard draft')
    }
    return res.json()
}


export const promoteDraft = async (draftId: string, planId: string, aiUrl: string) => {
    const res = await fetch(`${aiUrl}/rag/save`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draftId, plan_id: planId }),
    })
    if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Failed to migrate documents')
    }
    return res.json()
}