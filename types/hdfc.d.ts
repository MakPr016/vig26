// types/hdfc.d.ts
// Type declarations for HDFC SmartGateway (Juspay) API response shapes

export interface HdfcSessionResponse {
    order_id: string;
    status: string;
    payment_links: {
        web: string;
        mobile?: string;
        iframe?: string;
    };
    merchant_id?: string;
}

export interface HdfcOrderStatus {
    order_id: string;
    /** e.g. "CHARGED" | "PENDING_VBV" | "AUTHORIZATION_FAILED" | "AUTHENTICATION_FAILED" | "JUSPAY_DECLINED" | "NEW" */
    status: string;
    amount: string; // decimal string e.g. "100.00"
    currency?: string;
    customer_id?: string;
    customer_email?: string;
}

export interface HdfcWebhookPayload {
    order_id: string;
    status: string;
    /** Payment details nested object */
    payment?: {
        payment_id?: string;
        payment_method?: string;
        payment_method_type?: string;
        amount?: number;
        error_code?: string;
        error_message?: string;
    };
    merchant_id?: string;
    content?: {
        order?: HdfcOrderStatus;
    };
}
