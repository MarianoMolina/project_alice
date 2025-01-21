import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
} from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import { useApi } from '../../../../contexts/ApiContext';
import Logger from '../../../../utils/Logger';

interface UpgradeInterestDialogProps {
    open: boolean;
    onClose: () => void;
}

export const UpgradeInterestDialog: React.FC<UpgradeInterestDialogProps> = ({
    open,
    onClose,
}) => {
    const { user } = useAuth();
    const { updateUserStats } = useApi();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const hasIndicatedInterest = user?.stats?.interested_in_premium === true;

    Logger.info('UpgradeInterestDialog', 'hasIndicatedInterest', hasIndicatedInterest, user);

    const handleSubmit = async () => {
        if (!user?._id) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await updateUserStats(user._id, {
                interested_in_premium: true
            });
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update preference');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setError(null);
            setSubmitted(false);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {submitted ? 'Thank You!' : 'Interested in Project Alice Premium?'}
            </DialogTitle>
            <DialogContent>
                {(hasIndicatedInterest || submitted) ? (
                    <Box sx={{ py: 2 }}>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            We've recorded your interest in Project Alice Premium!
                        </Alert>
                        <Typography>
                            We'll notify you as soon as premium features become available.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ py: 2 }}>
                        <Typography paragraph>
                            Project Alice Premium lets you access our managed API infrastructure,
                            allowing you to test and deploy workflows without managing individual API keys.
                        </Typography>
                        <Typography paragraph>
                            While we're in alpha, premium features aren't yet available. Would you like
                            to be notified when they are?
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {(hasIndicatedInterest || submitted) ? (
                    <Button onClick={handleClose} color="primary">
                        Close
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            color="primary"
                            variant="contained"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Notify Me'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
export const PremiumButton: React.FC = () => {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
            <button onClick={() => setDialogOpen(true)}
                className="ml-1 inline-flex h-8 animate-shimmer items-center justify-center rounded-md border border-yellow-500 bg-[linear-gradient(110deg,#3b3300,45%,#e0c200,55%,#3b3300)] bg-[length:200%_100%] px-6 font-medium text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-yellow-50"
            >
                Go Premium
            </button>
            <UpgradeInterestDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </>
    );
};