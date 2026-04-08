// =============================================================================
// components/sidebar/DeleteConfirmDialog.tsx — confirm-before-delete overlay
// =============================================================================

import type { FC } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
    address: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmDialog: FC<Props> = ({ address, onConfirm, onCancel }) => (
    <div className="confirm-overlay" role="alertdialog" aria-modal="true" aria-label="Confirm removal">
        <div className="confirm-dialog">
            <div className="confirm-icon">
                <AlertTriangle size={22} />
            </div>
            <p className="confirm-title">Remove saved parcel?</p>
            <p className="confirm-body">
                <strong>{address}</strong> will be removed from your saved list.
            </p>
            <div className="confirm-actions">
                <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
                <button className="confirm-delete" onClick={onConfirm}>Remove</button>
            </div>
        </div>
    </div>
);

export default DeleteConfirmDialog;
