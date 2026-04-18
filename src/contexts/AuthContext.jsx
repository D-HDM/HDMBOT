import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('hdm_token')
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      const res = await authAPI.verify(token)
      if (res.data.success) {
        setUser(res.data.user)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('hdm_token')
        localStorage.removeItem('hdm_user')
      }
    } catch (err) {
      localStorage.removeItem('hdm_token')
      localStorage.removeItem('hdm_user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, remember = false) => {
    try {
      const res = await authAPI.login(email, password)
      if (res.data.success) {
        const { token, user } = res.data
        localStorage.setItem('hdm_token', token)
        if (remember) localStorage.setItem('hdm_user', JSON.stringify(user))
        setUser(user)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (err) {
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('hdm_token')
    localStorage.removeItem('hdm_user')
    setUser(null)
    setIsAuthenticated(false)
  }

  const getUserName = () => {
    if (user?.name) return user.name
    if (user?.email) return user.email.split('@')[0]
    const stored = localStorage.getItem('hdm_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        return u.name || u.email?.split('@')[0] || 'Admin'
      } catch (e) {}
    }
    return 'Admin'
  }

  const getUserEmail = () => {
    if (user?.email) return user.email
    const stored = localStorage.getItem('hdm_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        return u.email || 'admin@hdm.local'
      } catch (e) {}
    }
    return 'admin@hdm.local'
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getUserName,
    getUserEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}