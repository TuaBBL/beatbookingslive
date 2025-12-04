import { X, Upload, Save, MapPin, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StateSelector } from './StateSelector';

interface EditUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    full_name: string;
    location: string;
    state_territory: string | null;
    phone_number: string | null;
    profile_image_url: string | null;
  };
  onSuccess: () => void;
}

export function EditUserProfileModal({ isOpen, onClose, user, onSuccess }: EditUserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState(user.full_name);
  const [location, setLocation] = useState(user.location);
  const [stateTerritory, setStateTerritory] = useState(user.state_territory || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(user.profile_image_url);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setLocation(user.location || '');
      setStateTerritory(user.state_territory || '');
      setPhoneNumber(user.phone_number || '');
      setProfileImagePreview(user.profile_image_url || null);
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!profileImage) return profileImagePreview;

    try {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-profiles')
        .upload(fileName, profileImage, {
          upsert: true,
          contentType: profileImage.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let profileImageUrl = profileImagePreview;

      if (profileImage) {
        profileImageUrl = await uploadProfileImage();
      }

      const trimmedFullName = fullName.trim();
      const trimmedLocation = location.trim();
      const trimmedStateTerritory = stateTerritory.trim();

      const isProfileComplete = !!(
        trimmedFullName &&
        trimmedLocation &&
        trimmedStateTerritory
      );

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName || null,
          location: trimmedLocation || null,
          state_territory: trimmedStateTerritory || null,
          phone_number: phoneNumber.trim() || null,
          profile_image_url: profileImageUrl || null,
          profile_completed: isProfileComplete,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          full_name: trimmedFullName || null,
          location: trimmedLocation || null,
          state_territory: trimmedStateTerritory || null,
          phone_number: phoneNumber.trim() || null,
          profile_image_url: profileImageUrl || null,
          profile_completed: isProfileComplete,
        })
        .eq('id', user.id);

      if (userUpdateError) throw userUpdateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto p-4">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="bg-gray-900 rounded-lg max-w-md w-full border-2 border-[#39ff14] glow-green my-8">
        <div className="border-b border-[#39ff14] p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-fluro-green">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-fluro-green-subtle hover:text-fluro-green transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-fluro-green-subtle text-sm font-medium mb-2">
              Profile Image (Optional)
            </label>
            <div className="flex flex-col items-center">
              {profileImagePreview ? (
                <div className="relative inline-block mb-4">
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-2 border-[#39ff14]"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 transition-colors mb-4">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-fluro-green-subtle mb-2" />
                    <p className="text-sm text-fluro-green-subtle">Click to upload</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              {!profileImagePreview && (
                <label className="w-full px-4 py-2 border-2 border-[#39ff14] text-[#39ff14] rounded-lg hover:bg-[#39ff14] hover:text-gray-900 transition-colors font-semibold text-center cursor-pointer">
                  <Upload className="w-5 h-5 inline mr-2" />
                  Choose Image
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-fluro-green-subtle text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-fluro-green-subtle focus:border-[#39ff14] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-fluro-green-subtle text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <StateSelector
              value={stateTerritory}
              onChange={(value) => setStateTerritory(value as string)}
              required={true}
              label="State/Territory"
              placeholder="Select your state/territory"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-fluro-green-subtle text-sm font-medium mb-2">
              City/Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fluro-green-subtle opacity-50" />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded pl-10 pr-4 py-2 text-fluro-green-subtle focus:border-[#39ff14] focus:outline-none"
                placeholder="Enter your city"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-fluro-green-subtle text-sm font-medium mb-2">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-fluro-green-subtle opacity-50" />
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded pl-10 pr-4 py-2 text-fluro-green-subtle focus:border-[#39ff14] focus:outline-none"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-700 text-fluro-green-subtle rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#39ff14] text-black rounded-lg hover:bg-[#2acc00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
