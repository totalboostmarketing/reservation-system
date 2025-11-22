'use client'

import { Input, Button } from '@/components/ui'
import { useState } from 'react'

interface CustomerFormProps {
  onSubmit: (data: CustomerData) => void
  initialData?: Partial<CustomerData>
  messages: {
    name: string
    email: string
    phone: string
    couponCode: string
    applyCoupon: string
    termsAgreement: string
    next: string
    required: string
    invalidEmail: string
    invalidPhone: string
    mustAgreeToTerms: string
  }
}

export interface CustomerData {
  customerName: string
  customerEmail: string
  customerPhone: string
  couponCode?: string
  agreedToTerms: boolean
}

export function CustomerForm({ onSubmit, initialData, messages }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerData>({
    customerName: initialData?.customerName || '',
    customerEmail: initialData?.customerEmail || '',
    customerPhone: initialData?.customerPhone || '',
    couponCode: initialData?.couponCode || '',
    agreedToTerms: initialData?.agreedToTerms || false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerData, string>> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = messages.required
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = messages.required
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = messages.invalidEmail
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = messages.required
    } else if (!/^[0-9-+()]{10,}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
      newErrors.customerPhone = messages.invalidPhone
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = messages.mustAgreeToTerms
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={messages.name}
        value={formData.customerName}
        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
        error={errors.customerName}
        required
      />

      <Input
        label={messages.email}
        type="email"
        value={formData.customerEmail}
        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
        error={errors.customerEmail}
        required
      />

      <Input
        label={messages.phone}
        type="tel"
        value={formData.customerPhone}
        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
        error={errors.customerPhone}
        required
      />

      <div className="flex gap-2">
        <Input
          label={messages.couponCode}
          value={formData.couponCode || ''}
          onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
          className="flex-1"
        />
      </div>

      <div className="mt-6">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreedToTerms}
            onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
            className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">{messages.termsAgreement}</span>
        </label>
        {errors.agreedToTerms && (
          <p className="mt-1 text-sm text-red-500">{errors.agreedToTerms}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-6">
        {messages.next}
      </Button>
    </form>
  )
}
