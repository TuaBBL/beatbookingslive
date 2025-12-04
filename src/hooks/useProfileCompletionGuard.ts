import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ProfileCompletionState {
  loading: boolean;
  needsSubscription: boolean;
  needsProfile: boolean;
  showCreateUserProfile: boolean;
  userProfileData: any;
  isArtist: boolean;
  redirectToCreateArtist: boolean;
}

export function useProfileCompletionGuard(user: User | null) {
  const [state, setState] = useState<ProfileCompletionState>({
    loading: false,
    needsSubscription: false,
    needsProfile: false,
    showCreateUserProfile: false,
    userProfileData: null,
    isArtist: false,
    redirectToCreateArtist: false,
  });

  useEffect(() => {
    if (!user) {
      setState({
        loading: false,
        needsSubscription: false,
        needsProfile: false,
        showCreateUserProfile: false,
        userProfileData: null,
        isArtist: false,
        redirectToCreateArtist: false,
      });
      return;
    }

    // Delay slightly to avoid initial render loop
    const timer = setTimeout(() => {
      checkProfileCompletion(user);
    }, 250);

    return () => clearTimeout(timer);
  }, [user]);

  async function checkProfileCompletion(authUser: User) {
    console.log('[ProfileGuard] Checking profile for:', authUser.id);
    setState(prev => ({ ...prev, loading: true }));

    const currentPath = window.location.pathname;
    const isOnCreateArtist = currentPath === '/create-artist';

    try {
      // First, check if user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      // If user doesn't exist in database, sign them out (orphaned auth user)
      if (!userData || userError) {
        console.error('[ProfileGuard] User not found in database, signing out:', userError);
        await supabase.auth.signOut();
        window.location.href = '/';
        return;
      }

      const userRole = authUser.user_metadata?.role;
      console.log('[ProfileGuard] Role:', userRole);

      if (userRole === 'artist') {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        const hasActiveSub =
          subscription &&
          (subscription.status === 'active' ||
            subscription.is_free_forever === true);

        if (!hasActiveSub) {
          console.log('[ProfileGuard] Artist missing subscription');
          setState({
            loading: false,
            needsSubscription: true,
            needsProfile: false,
            showCreateUserProfile: false,
            userProfileData: null,
            isArtist: true,
            redirectToCreateArtist: false,
          });
          return;
        }

        const { data: artistCard } = await supabase
          .from('artist_cards')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (!artistCard) {
          console.log('[ProfileGuard] No artist card');

          // Prevent redirect loop
          if (!isOnCreateArtist) {
            console.log('[ProfileGuard] Redirecting to create-artist');
            setState({
              loading: false,
              needsSubscription: false,
              needsProfile: true,
              showCreateUserProfile: false,
              userProfileData: null,
              isArtist: true,
              redirectToCreateArtist: true,
            });
          } else {
            console.log('[ProfileGuard] Already on create-artist, no redirect');
            setState(prev => ({
              ...prev,
              loading: false,
              needsProfile: true,
              redirectToCreateArtist: false,
            }));
          }

          return;
        }

        const missingRequiredFields =
          !artistCard.name ||
          !artistCard.stage_name ||
          !artistCard.category ||
          !artistCard.genre ||
          !artistCard.phone ||
          !artistCard.locations?.length ||
          !artistCard.state_territories?.length;

        if (missingRequiredFields) {
          console.log('[ProfileGuard] Artist card incomplete');

          if (!isOnCreateArtist) {
            setState({
              loading: false,
              needsSubscription: false,
              needsProfile: true,
              showCreateUserProfile: false,
              userProfileData: null,
              isArtist: true,
              redirectToCreateArtist: true,
            });
          } else {
            setState(prev => ({
              ...prev,
              loading: false,
              needsProfile: true,
              redirectToCreateArtist: false,
            }));
          }

          return;
        }

        console.log('[ProfileGuard] Artist profile complete');
        setState({
          loading: false,
          needsSubscription: false,
          needsProfile: false,
          showCreateUserProfile: false,
          userProfileData: null,
          isArtist: true,
          redirectToCreateArtist: false,
        });
        return;
      }

      // NON-ARTIST USERS
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profileData) {
        console.log('[ProfileGuard] Show create user modal');
        setState({
          loading: false,
          needsSubscription: false,
          needsProfile: false,
          showCreateUserProfile: true,
          userProfileData: null,
          isArtist: false,
          redirectToCreateArtist: false,
        });
        return;
      }

      const incompleteUser =
        !profileData.full_name ||
        !profileData.location ||
        !profileData.state_territory ||
        profileData.profile_completed !== true;

      if (incompleteUser) {
        console.log('[ProfileGuard] Show incomplete user modal');
        setState({
          loading: false,
          needsSubscription: false,
          needsProfile: false,
          showCreateUserProfile: true,
          userProfileData: profileData,
          isArtist: false,
          redirectToCreateArtist: false,
        });
        return;
      }

      console.log('[ProfileGuard] User complete');
      setState({
        loading: false,
        needsSubscription: false,
        needsProfile: false,
        showCreateUserProfile: false,
        userProfileData: profileData,
        isArtist: false,
        redirectToCreateArtist: false,
      });
    } catch (error) {
      console.error('[ProfileGuard] Unexpected error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }

  const refreshGuard = () => {
    if (user) checkProfileCompletion(user);
  };

  return { ...state, refreshGuard };
}
