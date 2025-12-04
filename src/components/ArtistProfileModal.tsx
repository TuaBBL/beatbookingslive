import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PhoneInput } from './PhoneInput';
import { StateSelector } from './StateSelector';

interface ArtistProfileModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  onClose: () => void;
  onComplete: () => void;
  onSubscribe: () => void;
}

export function ArtistProfileModal({ isOpen, userId, userEmail, onClose, onComplete, onSubscribe }: ArtistProfileModalProps) {
  const [existingArtistCardId, setExistingArtistCardId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    stageName: '',
    category: '',
    genre: '',
    location: '',
    about: '',
    phone: '',
    cost: '',
    costType: '',
    imageUrl: '',
    youtubeLink: '',
    instagramLink: '',
    facebookLink: '',
    soundcloudLink: '',
    mixcloudLink: '',
    spotifyLink: '',
    tiktokLink: '',
  });
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [additionalImages, setAdditionalImages] = useState<string[]>(['']);
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAdditionalImage, setUploadingAdditionalImage] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<number | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const fetchExistingData = async () => {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const isProfileIncomplete = !userProfile ||
        !userProfile.full_name ||
        !userProfile.location ||
        !userProfile.state_territory;

      if (isProfileIncomplete) {
        setError('Please complete your user profile before creating an artist profile.');
        return;
      }

      const { data: existingCard, error: cardError } = await supabase
        .from('artist_cards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cardError && cardError.code !== 'PGRST116') {
        console.error('Error fetching existing artist card:', cardError);
        return;
      }

      if (existingCard) {
        setExistingArtistCardId(existingCard.id);

        setFormData({
          name: existingCard.name || '',
          stageName: existingCard.stage_name || '',
          category: existingCard.category || '',
          genre: existingCard.genre || '',
          location: existingCard.location || '',
          about: existingCard.about || '',
          phone: existingCard.phone || '',
          cost: existingCard.cost?.toString() || '',
          costType: existingCard.cost_type || '',
          imageUrl: existingCard.image_url || '',
          youtubeLink: existingCard.youtube_link || '',
          instagramLink: existingCard.instagram_link || '',
          facebookLink: existingCard.facebook_link || '',
          soundcloudLink: existingCard.soundcloud_link || '',
          mixcloudLink: existingCard.mixcloud_link || '',
          spotifyLink: existingCard.spotify_link || '',
          tiktokLink: existingCard.tiktok_link || '',
        });
        setSelectedLocations(existingCard.locations || []);
        setSelectedStates(existingCard.state_territories || []);
        setAdditionalImages(existingCard.additional_images || ['']);
        setVideoUrls(existingCard.video_urls || ['']);
      } else {
        setExistingArtistCardId(null);
        setFormData({
          name: userProfile.full_name || '',
          stageName: '',
          category: '',
          genre: '',
          location: userProfile.location || '',
          about: '',
          phone: userProfile.phone_number || '',
          cost: '',
          costType: '',
          imageUrl: userProfile.profile_image_url || '',
          youtubeLink: '',
          instagramLink: '',
          facebookLink: '',
          soundcloudLink: '',
          mixcloudLink: '',
          spotifyLink: '',
          tiktokLink: '',
        });
        setSelectedLocations(userProfile.location ? [userProfile.location] : []);
        setSelectedStates(userProfile.state_territory ? [userProfile.state_territory] : []);
        setAdditionalImages(['']);
        setVideoUrls(['']);
      }

      const { data: existingProfile, error: profileError } = await supabase
        .from('artist_profiles')
        .select('phone')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching existing artist profile:', profileError);
        return;
      }

      if (existingProfile) {
        setFormData(prev => ({
          ...prev,
          phone: existingProfile.phone || prev.phone
        }));
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchExistingData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const isFieldInvalid = (fieldName: string) => invalidFields.includes(fieldName);

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    if (isFieldInvalid(fieldName)) {
      return baseClassName.replace('border-[#39ff14] border-opacity-50', 'border-white border-opacity-100');
    }
    return baseClassName;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (invalidFields.includes(e.target.name)) {
      setInvalidFields(invalidFields.filter(field => field !== e.target.name));
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, location: value }));
    if (invalidFields.includes('location')) {
      setInvalidFields(invalidFields.filter(field => field !== 'location'));
    }

    if (value.trim().length >= 2) {
      const cities = [
        'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK', 'Glasgow, UK', 'Liverpool, UK', 'Newcastle, UK', 'Sheffield, UK', 'Bristol, UK', 'Edinburgh, UK',
        'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA', 'Miami, USA', 'San Francisco, USA', 'Seattle, USA', 'Boston, USA', 'Austin, USA', 'Denver, USA',
        'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada',
        'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia', 'Adelaide, Australia', 'Gold Coast, Australia', 'Canberra, Australia', 'Newcastle, Australia', 'Wollongong, Australia', 'Sunshine Coast, Australia', 'Hobart, Australia', 'Geelong, Australia', 'Townsville, Australia', 'Cairns, Australia', 'Darwin, Australia', 'Toowoomba, Australia', 'Ballarat, Australia', 'Bendigo, Australia', 'Albury, Australia', 'Launceston, Australia', 'Mackay, Australia', 'Rockhampton, Australia', 'Bunbury, Australia', 'Bundaberg, Australia', 'Wagga Wagga, Australia', 'Hervey Bay, Australia', 'Mildura, Australia', 'Shepparton, Australia', 'Port Macquarie, Australia', 'Gladstone, Australia', 'Tamworth, Australia', 'Karratha, Australia',
        'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand', 'Hamilton, New Zealand', 'Tauranga, New Zealand', 'Dunedin, New Zealand', 'Palmerston North, New Zealand', 'Napier, New Zealand', 'Nelson, New Zealand', 'Rotorua, New Zealand', 'New Plymouth, New Zealand', 'Whangarei, New Zealand', 'Invercargill, New Zealand', 'Whanganui, New Zealand', 'Gisborne, New Zealand', 'Queenstown, New Zealand', 'Timaru, New Zealand',
        'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany',
        'Paris, France', 'Lyon, France', 'Marseille, France',
        'Amsterdam, Netherlands', 'Rotterdam, Netherlands',
        'Barcelona, Spain', 'Madrid, Spain', 'Valencia, Spain',
        'Rome, Italy', 'Milan, Italy', 'Naples, Italy',
        'Dublin, Ireland', 'Cork, Ireland',
        'Copenhagen, Denmark', 'Stockholm, Sweden', 'Oslo, Norway', 'Helsinki, Finland',
        'Brussels, Belgium', 'Zurich, Switzerland', 'Vienna, Austria',
        'Prague, Czech Republic', 'Warsaw, Poland', 'Budapest, Hungary',
        'Lisbon, Portugal', 'Athens, Greece', 'Istanbul, Turkey',
        'Dubai, UAE', 'Singapore', 'Hong Kong', 'Tokyo, Japan', 'Seoul, South Korea',
        'Mumbai, India', 'Delhi, India', 'Bangalore, India',
        'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Buenos Aires, Argentina',
        'Mexico City, Mexico', 'Cape Town, South Africa', 'Johannesburg, South Africa'
      ];
      const filtered = cities
        .filter(city => city.toLowerCase().includes(value.toLowerCase()))
        .filter(city => !selectedLocations.includes(city))
        .slice(0, 10);
      setLocationSuggestions(filtered);
      setShowLocationDropdown(true);
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const selectLocation = (location: string) => {
    if (!selectedLocations.includes(location)) {
      setSelectedLocations([...selectedLocations, location]);
    }
    setFormData(prev => ({ ...prev, location: '' }));
    setLocationSuggestions([]);
    setShowLocationDropdown(false);
    if (invalidFields.includes('location')) {
      setInvalidFields(invalidFields.filter(field => field !== 'location'));
    }
  };

  const removeLocation = (locationToRemove: string) => {
    setSelectedLocations(selectedLocations.filter(loc => loc !== locationToRemove));
  };

  const handleLocationInputFocus = () => {
    if (formData.location.trim().length >= 2) {
      setShowLocationDropdown(true);
    }
  };

  const handleLocationInputBlur = () => {
    setTimeout(() => {
      setShowLocationDropdown(false);
    }, 300);
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...additionalImages];
    newImages[index] = value;
    setAdditionalImages(newImages);
  };

  const addImageField = () => {
    setAdditionalImages([...additionalImages, '']);
  };

  const removeImageField = (index: number) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    setAdditionalImages(newImages.length === 0 ? [''] : newImages);
  };

  const handleVideoChange = (index: number, value: string) => {
    const newVideos = [...videoUrls];
    newVideos[index] = value;
    setVideoUrls(newVideos);
  };

  const addVideoField = () => {
    setVideoUrls([...videoUrls, '']);
  };

  const removeVideoField = (index: number) => {
    const newVideos = videoUrls.filter((_, i) => i !== index);
    setVideoUrls(newVideos.length === 0 ? [''] : newVideos);
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artist-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artist-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      if (invalidFields.includes('imageUrl')) {
        setInvalidFields(invalidFields.filter(field => field !== 'imageUrl'));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdditionalImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingAdditionalImage(index);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${index}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artist-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artist-images')
        .getPublicUrl(filePath);

      handleImageChange(index, publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingAdditionalImage(null);
    }
  };

  const handleVideoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Video size must be less than 100MB');
      return;
    }

    setUploadingVideo(index);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${index}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artist-videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('artist-videos')
        .getPublicUrl(filePath);

      handleVideoChange(index, publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploadingVideo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvalidFields([]);

    const required = ['name', 'stageName', 'genre', 'about', 'imageUrl', 'phone'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);

    if (selectedLocations.length === 0) {
      missing.push('location');
    }

    if (selectedStates.length === 0) {
      missing.push('states');
    }

    if (missing.length > 0) {
      setInvalidFields(missing);
      const fieldNames: Record<string, string> = {
        name: 'Full Name',
        stageName: 'Stage Name',
        genre: 'Genre',
        location: 'At least one Location',
        states: 'At least one State/Territory',
        about: 'About',
        imageUrl: 'Main Profile Image',
        phone: 'Phone Number'
      };
      const missingFieldNames = missing.map(field => fieldNames[field]).join(', ');
      setError(`Please fill in the following required fields: ${missingFieldNames}`);

      const firstMissingField = document.querySelector(`[name="${missing[0]}"]`) as HTMLElement;
      if (firstMissingField) {
        firstMissingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstMissingField.focus();
      }
      return;
    }

    setLoading(true);

    try {
      const filteredImages = additionalImages.filter(img => img.trim() !== '');
      const filteredVideos = videoUrls.filter(vid => vid.trim() !== '');

      let artistCard;
      let artistError;

      const artistCardData = {
        user_id: userId,
        name: formData.name,
        stage_name: formData.stageName,
        category: formData.category,
        genre: formData.genre,
        location: selectedLocations[0] || '',
        locations: selectedLocations,
        state_territories: selectedStates,
        about: formData.about,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        cost_type: formData.cost && formData.costType ? formData.costType : null,
        image_url: formData.imageUrl,
        additional_images: filteredImages,
        video_urls: filteredVideos,
        youtube_link: formData.youtubeLink,
        instagram_link: formData.instagramLink,
        facebook_link: formData.facebookLink,
        soundcloud_link: formData.soundcloudLink,
        mixcloud_link: formData.mixcloudLink,
        spotify_link: formData.spotifyLink,
        tiktok_link: formData.tiktokLink,
        availability: 'available',
        rating: 0,
        email: userEmail,
        phone: formData.phone || null,
      };

      if (existingArtistCardId) {
        // Update existing artist card
        const { data, error } = await supabase
          .from('artist_cards')
          .update(artistCardData)
          .eq('id', existingArtistCardId)
          .select()
          .single();
        
        artistCard = data;
        artistError = error;
      } else {
        // Create new artist card
        const { data, error } = await supabase
          .from('artist_cards')
          .insert(artistCardData)
          .select()
          .single();
        
        artistCard = data;
        artistError = error;
      }

      if (artistError) throw artistError;

      const { error: profileError } = await supabase
        .from('artist_profiles')
        .upsert({
          user_id: userId,
          artist_card_id: artistCard.id,
          email: userEmail,
          phone: formData.phone,
          profile_completed: true,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      if (existingArtistCardId) {
        onComplete();
      } else {
        onSubscribe();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 overflow-y-auto p-0 md:p-4">
      <div className="min-h-screen md:min-h-0 flex items-center justify-center py-4 md:py-8">
        <div
          className="bg-gray-900 rounded-xl md:rounded-2xl border-2 border-red-500 glow-red-strong max-w-6xl w-full transition-all duration-[250ms] ease-in-out"
          style={{
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="relative p-3 md:p-8">
          <button
            onClick={onClose}
            className="fixed md:absolute top-2.5 right-2.5 md:top-4 md:right-4 bg-black bg-opacity-70 rounded-full p-2 text-fluro-green-subtle hover:text-fluro-green hover:bg-opacity-100 transition-all duration-300 z-[999]"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl md:text-3xl font-bold text-fluro-green mb-1 md:mb-2 mt-10 md:mt-0">
            {existingArtistCardId ? 'Update Your Artist Profile' : 'Complete Your Artist Profile'}
          </h2>
          <p className="text-fluro-green-subtle mb-3 md:mb-6 text-sm md:text-base">
            {existingArtistCardId ? 'Update your information and manage your profile' : 'Fill in your details to get started on Beat Bookings Live'}
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-30 border-2 border-red-500 rounded-lg animate-pulse">
              <p className="text-white text-base font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
            <section className="bg-black bg-opacity-30 rounded-lg p-3 md:p-6 border border-red-500 border-opacity-30">
              <h3 className="text-xl font-bold text-fluro-green mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={getFieldClassName('name', 'w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300')}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Stage Name * <span className="text-xs font-normal opacity-70">(displayed on your artist card)</span>
                  </label>
                  <input
                    type="text"
                    name="stageName"
                    value={formData.stageName}
                    onChange={handleChange}
                    className={getFieldClassName('stageName', 'w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300')}
                    placeholder="Your performance/stage name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] focus:outline-none focus:border-opacity-100 transition-all duration-300"
                  >
                    <option value="">Select a category</option>
                    <option value="DJ">DJ</option>
                    <option value="Band">Band</option>
                    <option value="Solo Artist">Solo Artist</option>
                    <option value="Producer">Producer</option>
                    <option value="Duo">Duo</option>
                    <option value="MC">MC</option>
                    <option value="Specialty Act">Specialty Act</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Genre *
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    className={getFieldClassName('genre', 'w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300')}
                    placeholder="e.g., House, Techno, Rock, Jazz"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <StateSelector
                    value={selectedStates}
                    onChange={(value) => {
                      setSelectedStates(value as string[]);
                      if (invalidFields.includes('states')) {
                        setInvalidFields(invalidFields.filter(field => field !== 'states'));
                      }
                    }}
                    multiple={true}
                    required={true}
                    label="State/Territory Service Areas *"
                    placeholder="Select states where you perform"
                    error={invalidFields.includes('states') ? 'At least one state is required' : undefined}
                  />
                  <p className="mt-1 text-xs text-fluro-green-subtle opacity-70">
                    Select all states and territories where you are available to perform
                  </p>
                </div>

                <div className="relative md:col-span-2">
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Cities/Locations * <span className="text-xs font-normal opacity-70">(add specific cities within your service areas)</span>
                  </label>

                  {selectedLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedLocations.map((loc, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-[#39ff14] bg-opacity-20 border border-[#39ff14] rounded-lg text-[#39ff14] text-sm"
                        >
                          <span>{loc}</span>
                          <button
                            type="button"
                            onClick={() => removeLocation(loc)}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleLocationChange}
                    onFocus={handleLocationInputFocus}
                    onBlur={handleLocationInputBlur}
                    className={getFieldClassName('location', 'w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300')}
                    placeholder="Start typing city name to add..."
                    autoComplete="off"
                  />
                  {showLocationDropdown && (
                    <div className="absolute z-[100] w-full mt-1 bg-gray-800 border-2 border-[#39ff14] border-opacity-70 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                      {locationSuggestions.length > 0 ? (
                        locationSuggestions.map((location, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectLocation(location);
                            }}
                            className="w-full text-left px-4 py-3 text-[#39ff14] hover:bg-gray-700 cursor-pointer transition-colors duration-200 border-b border-[#39ff14] border-opacity-20 last:border-b-0"
                          >
                            {location}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-[#39ff14] opacity-60 text-sm">
                          {formData.location.trim().length < 2 ? 'Type at least 2 characters...' : 'No matching locations or all already selected'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Booking Cost (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#39ff14] pointer-events-none">$</span>
                      <input
                        type="number"
                        name="cost"
                        value={formData.cost}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                        placeholder="500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <select
                      name="costType"
                      value={formData.costType}
                      onChange={handleChange}
                      disabled={!formData.cost}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] focus:outline-none focus:border-opacity-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select type</option>
                      <option value="per_hour">Per Hour</option>
                      <option value="per_event">Per Event</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                  About *
                </label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  className={getFieldClassName('about', 'w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300 min-h-[120px]')}
                  placeholder="Tell us about yourself, your music style, experience..."
                  required
                />
              </div>
            </section>

            <section className="bg-black bg-opacity-30 rounded-lg p-3 md:p-6 border border-red-500 border-opacity-30">
              <h3 className="text-xl font-bold text-fluro-green mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Phone Number (Optional)
                  </label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(value) => setFormData({ ...formData, phone: value })}
                    placeholder="1234567890"
                  />
                </div>
              </div>
            </section>

            <section className="bg-black bg-opacity-30 rounded-lg p-3 md:p-6 border border-red-500 border-opacity-30">
              <h3 className="text-xl font-bold text-fluro-green mb-4">Media</h3>

              <div className="mb-6">
                <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                  Main Profile Image *
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className={getFieldClassName('imageUrl', 'flex-1 px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300')}
                      placeholder="https://example.com/image.jpg or upload below"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-fluro-green-subtle text-sm">or</span>
                    <label className="flex items-center gap-2 px-4 py-2 bg-[#39ff14] bg-opacity-20 border border-[#39ff14] text-[#39ff14] rounded-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {uploadingImage ? 'Uploading...' : 'Upload from Device'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    {formData.imageUrl && (
                      <img src={formData.imageUrl} alt="Preview" className="h-10 w-10 object-cover rounded border border-[#39ff14]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-fluro-green-subtle text-sm font-semibold">
                    Additional Images
                  </label>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="flex items-center gap-2 px-3 py-1 bg-[#39ff14] bg-opacity-20 border border-[#39ff14] text-[#39ff14] rounded-lg text-sm hover:bg-opacity-30 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Image
                  </button>
                </div>
                <div className="space-y-3">
                  {additionalImages.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                          placeholder="https://example.com/image.jpg or upload below"
                        />
                        {additionalImages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="px-3 py-2 bg-red-500 bg-opacity-20 border border-red-500 text-red-500 rounded-lg hover:bg-opacity-30 transition-all duration-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-2">
                        <span className="text-fluro-green-subtle text-sm">or</span>
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#39ff14] bg-opacity-20 border border-[#39ff14] text-[#39ff14] rounded-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300">
                          <Upload className="w-3 h-3" />
                          <span className="text-xs font-semibold">
                            {uploadingAdditionalImage === index ? 'Uploading...' : 'Upload'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAdditionalImageUpload(index, e)}
                            disabled={uploadingAdditionalImage === index}
                            className="hidden"
                          />
                        </label>
                        {image && (
                          <img src={image} alt="Preview" className="h-8 w-8 object-cover rounded border border-[#39ff14]" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-fluro-green-subtle text-sm font-semibold">
                    Video URLs
                  </label>
                  <button
                    type="button"
                    onClick={addVideoField}
                    className="flex items-center gap-2 px-3 py-1 bg-[#39ff14] bg-opacity-20 border border-[#39ff14] text-[#39ff14] rounded-lg text-sm hover:bg-opacity-30 transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Video
                  </button>
                </div>
                <div className="space-y-3">
                  {videoUrls.map((video, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={video}
                          onChange={(e) => handleVideoChange(index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                          placeholder="https://youtube.com/watch?v=... or upload below"
                        />
                        {videoUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVideoField(index)}
                            className="px-3 py-2 bg-red-500 bg-opacity-20 border border-red-500 text-red-500 rounded-lg hover:bg-opacity-30 transition-all duration-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-2">
                        <span className="text-fluro-green-subtle text-sm">or</span>
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#39ff14] bg-opacity-20 border border-[#39ff14] text-[#39ff14] rounded-lg cursor-pointer hover:bg-opacity-30 transition-all duration-300">
                          <Upload className="w-3 h-3" />
                          <span className="text-xs font-semibold">
                            {uploadingVideo === index ? 'Uploading...' : 'Upload Video'}
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoUpload(index, e)}
                            disabled={uploadingVideo === index}
                            className="hidden"
                          />
                        </label>
                        {video && video.includes('supabase') && (
                          <span className="text-xs text-[#39ff14]">✓ Uploaded</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-black bg-opacity-30 rounded-lg p-3 md:p-6 border border-red-500 border-opacity-30">
              <h3 className="text-xl font-bold text-fluro-green mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="youtubeLink"
                    value={formData.youtubeLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="instagramLink"
                    value={formData.instagramLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebookLink"
                    value={formData.facebookLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    SoundCloud
                  </label>
                  <input
                    type="url"
                    name="soundcloudLink"
                    value={formData.soundcloudLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://soundcloud.com/..."
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Mixcloud
                  </label>
                  <input
                    type="url"
                    name="mixcloudLink"
                    value={formData.mixcloudLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://mixcloud.com/..."
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    Spotify
                  </label>
                  <input
                    type="url"
                    name="spotifyLink"
                    value={formData.spotifyLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://open.spotify.com/..."
                  />
                </div>

                <div>
                  <label className="block text-fluro-green-subtle text-sm font-semibold mb-2">
                    TikTok
                  </label>
                  <input
                    type="url"
                    name="tiktokLink"
                    value={formData.tiktokLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-[#39ff14] border-opacity-50 rounded-lg text-[#39ff14] placeholder-[#39ff14] placeholder-opacity-40 focus:outline-none focus:border-opacity-100 transition-all duration-300"
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
              </div>
            </section>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-[#39ff14] text-black rounded-lg font-bold text-lg hover:glow-green-strong transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving Profile...' : existingArtistCardId ? 'Update Profile' : 'Subscribe to Continue'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
