import { motion } from 'framer-motion'
import { FaHome, FaChevronRight, FaArrowRight, FaHeartbeat, FaShieldAlt, FaHammer, FaHandHoldingUsd, FaGavel, FaStethoscope, FaHeart, FaFileAlt, FaCar, FaHome as FaHomeIcon, FaLayerGroup, FaTint, FaThermometerHalf, FaWindowMaximize, FaBath, FaBug, FaWater, FaWrench, FaTools, FaBroom, FaTree, FaChartLine, FaMoneyBillWave, FaCarCrash, FaUserNurse, FaPlane, FaPlaneDeparture, FaSuitcase } from 'react-icons/fa'
import { servicesDb } from '../data/servicesData'
import './CategoryView.css'

const iconMap = {
  FaHeartbeat,
  FaShieldAlt,
  FaHammer,
  FaHandHoldingUsd,
  FaGavel,
  FaStethoscope,
  FaHeart,
  FaFileAlt,
  FaCar,
  FaHome: FaHomeIcon,
  FaLayerGroup,
  FaTint,
  FaThermometerHalf,
  FaWindowMaximize,
  FaBath,
  FaBug,
  FaWater,
  FaWrench,
  FaTools,
  FaBroom,
  FaTree,
  FaChartLine,
  FaMoneyBillWave,
  FaCarCrash,
  FaUserNurse,
  FaPlane,
  FaPlaneDeparture,
  FaSuitcase,
  FaActivity: FaHeartbeat
}

export default function CategoryView({ verticalId, onNavigateHome, onSelectSubVertical }) {
  const vertical = servicesDb[verticalId]

  if (!vertical) {
    return (
      <div className="category-error">
        <h2>Category Not Found</h2>
        <button onClick={onNavigateHome} className="btn btn-primary">Return Home</button>
      </div>
    )
  }

  const HeaderIcon = iconMap[vertical.icon] || FaShieldAlt

  return (
    <div className="category-view section">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb">
          <button onClick={onNavigateHome} className="breadcrumb-link">
            <FaHome style={{ marginRight: '6px' }} /> Home
          </button>
          <FaChevronRight className="breadcrumb-separator" />
          <span className="breadcrumb-current">{vertical.title}</span>
        </nav>

        {/* Category Header */}
        <div className="category-header">
          <div className="category-title-wrap">
            <div className="category-icon-box">
              <HeaderIcon />
            </div>
            <h1 className="category-title">{vertical.title} Services</h1>
          </div>
          <p className="category-subtitle">
            {vertical.description} Select a specific service category below to view detailed plans and check local pricing.
          </p>
        </div>

        {/* Sub-vertical Cards Grid */}
        <div className="category-grid">
          {Object.entries(vertical.subs).map(([subKey, sub]) => {
            const SubIcon = iconMap[sub.icon] || FaShieldAlt
            return (
              <motion.div
                key={subKey}
                className="sub-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectSubVertical(verticalId, subKey)}
              >
                <div className="sub-card-accent"></div>
                <div className="sub-card-body">
                  <div className="sub-card-header">
                    <div className="sub-card-icon">
                      <SubIcon />
                    </div>
                    <h3 className="sub-card-title">{sub.title}</h3>
                  </div>
                  <p className="sub-card-desc">{sub.desc}</p>
                  <button className="btn btn-secondary sub-card-btn">
                    View Plans <FaArrowRight style={{ marginLeft: '8px' }} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
