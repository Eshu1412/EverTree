import React from 'react'
import { motion } from 'framer-motion'
import { FaHome, FaChevronRight, FaPlane } from 'react-icons/fa'
import FlightCard from './FlightCard'
import './TravelServicesView.css'

export default function TravelServicesView({ onNavigateHome, onFormSubmitted }) {
  return (
    <div className="travel-services-view">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="travel-breadcrumb">
          <button onClick={onNavigateHome} className="travel-breadcrumb-link">
            <FaHome style={{ marginRight: '6px' }} /> Home
          </button>
          <FaChevronRight style={{ fontSize: '0.75rem' }} />
          <span className="travel-breadcrumb-current">Flight Booking</span>
        </nav>

        {/* Header Title Section - "Flight Booking" */}
        <div className="travel-header">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="travel-header-badge">
              <FaPlane /> Flight Quotes
            </div>
            <h1 className="travel-header-title">Flight Booking</h1>
            <p className="travel-header-subtitle">
              Compare competitive airfares across major carriers. Request a customized quote for one-way or round-trip journeys with zero hidden fees.
            </p>
          </motion.div>
        </div>

        {/* Central Flight Card Component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <FlightCard onFormSubmitted={onFormSubmitted} />
        </motion.div>
      </div>
    </div>
  )
}
