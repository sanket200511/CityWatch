import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, alert = false, delay = 0 }) => {
    return (
        <motion.div
            className={`card stat-card ${alert ? 'alert' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.02 }}
        >
            {Icon && (
                <div className={`mb-3 ${alert ? 'text-red-400' : 'text-blue-400'}`}>
                    <Icon className="w-6 h-6 mx-auto" />
                </div>
            )}
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </motion.div>
    );
};

export default StatCard;
