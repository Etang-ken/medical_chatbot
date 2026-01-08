import { Stethoscope, MessageCircle, Shield, Clock } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="w-20 h-20 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Stethoscope size={40} className="text-medical-700" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Your Medical Assistant
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          I'm Dr. Sarah, your AI medical assistant. I'm here to help you understand your symptoms and provide guidance based on comprehensive medical knowledge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <MessageCircle className="text-medical-600 mb-3 mx-auto" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Conversational</h3>
            <p className="text-sm text-gray-600">
              Describe your symptoms naturally, and I'll ask clarifying questions
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Shield className="text-medical-600 mb-3 mx-auto" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Evidence-Based</h3>
            <p className="text-sm text-gray-600">
              Backed by a comprehensive medical knowledge database
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Clock className="text-medical-600 mb-3 mx-auto" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">24/7 Available</h3>
            <p className="text-sm text-gray-600">
              Get instant guidance whenever you need it
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This is an informational tool, not a replacement for professional medical care. 
            For emergencies, call emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
