# Privacy Settings Guide

**Last Updated:** January 13, 2026  
**For:** fotolokashen Users

## 📖 Overview

fotolokashen gives you complete control over your privacy. This guide explains each privacy setting, what it does, and who can see what based on your choices.

## 🔒 Privacy Settings Explained

### 1. Profile Visibility

**What it controls:** Who can view your profile page

**Options:**
- **Public** (Default) - Everyone can see your profile
- **Followers** - Only people who follow you can see your profile
- **Private** - Only you can see your profile

**What people see:**

| Setting | Not Logged In | Logged In (Not Following) | Following You | You (Owner) |
|---------|--------------|--------------------------|--------------|-------------|
| Public | Full profile | Full profile | Full profile | Full profile |
| Followers | Privacy message | Privacy message | Full profile | Full profile |
| Private | Privacy message | Privacy message | Privacy message | Full profile |

**Privacy message includes:**
- Your name and avatar
- Your profile visibility setting
- Option to follow you (for "Followers" setting)
- Sign in/create account prompts (for guests)

**Example:**
If your profile is set to "Followers", someone who doesn't follow you will see:
```
🔒 This Profile is Followers-Only
Follow @yourname to see their profile
[Follow Button]
```

**Best for:**
- **Public:** Content creators, businesses, public figures
- **Followers:** Semi-private accounts, selective sharing
- **Private:** Maximum privacy, personal use only

---

### 2. Show in Search Results

**What it controls:** Whether your profile appears in user search

**Options:**
- ☑️ Enabled (Default) - You appear in search results
- ☐ Disabled - You don't appear in search results

**How it works:**
- When enabled: Users can find you by searching your name or username
- When disabled: You don't appear in any search results or autocomplete suggestions
- Direct URL access: Your profile is still accessible at `/@yourname` (subject to Profile Visibility settings)

**Example:**
```
User searches for "John Smith"

✅ If enabled: Your profile appears in results
❌ If disabled: Your profile doesn't appear (but can still be accessed via /@johnsmith)
```

**Best for:**
- **Enabled:** Want to be discoverable, grow your network
- **Disabled:** Want privacy, only share profile link directly

**Note:** This setting works independently of Profile Visibility. You can be searchable but have a private profile (users will find you but see the privacy message).

---

### 3. Saved Locations Privacy

**What it controls:** Who can see your saved locations on your profile

**Options:**
- **Public** (Default) - Everyone can see your saved locations
- **Followers** - Only your followers can see your saved locations
- **Private** - Only you can see your saved locations

**What people see:**

| Setting | Not Following | Following You | You (Owner) |
|---------|--------------|--------------|-------------|
| Public | All public locations | All public locations | All locations |
| Followers | Privacy message | All public locations | All locations |
| Private | Privacy message | Privacy message | All locations |

**Privacy message shows:**
```
🔒 Saved Locations are Private
[For Followers setting]: Follow @yourname to see their saved locations
[For Private setting]: @yourname's saved locations are private
```

**How it works:**
- This setting only affects the locations section on your profile
- Individual location visibility (public/private per location) is separate
- When set to "Followers", only public locations are shown to followers
- When set to "Private", even you see your locations on the profile (but can access via /locations page)

**Example:**
You have 50 saved locations (30 public, 20 private):
- **Public setting:** Others see your 30 public locations on your profile
- **Followers setting:** Followers see your 30 public locations, others see privacy message
- **Private setting:** Nobody sees locations on your profile, only you can via /locations page

**Best for:**
- **Public:** Share your favorite places with everyone
- **Followers:** Share with your network only
- **Private:** Keep your locations completely private

---

### 4. Show Location on Profile

**What it controls:** Whether your city and country appear on your profile

**Options:**
- ☑️ Enabled (Default) - Your location is shown
- ☐ Disabled - Your location is hidden

**How it works:**
- When enabled: "📍 City, Country" appears on your profile
- When disabled: No location information is shown

**Example:**
```
✅ Enabled: Shows "📍 New York, United States"
❌ Disabled: Location line doesn't appear
```

**Best for:**
- **Enabled:** Want to show where you're from, meet local users
- **Disabled:** Privacy concerns, don't want to share location

**Note:** This doesn't affect your ability to save locations or see others' locations. It only controls the display of YOUR city/country on YOUR profile.

---

### 5. Allow Follow Requests

**What it controls:** Whether other users can follow you

**Options:**
- ☑️ Enabled (Default) - Others can follow you
- ☐ Disabled - Follow button is hidden

**How it works:**
- When enabled: Follow button appears on your profile
- When disabled: Instead of a follow button, users see "This user is not accepting follow requests"

**Example:**
```
✅ Enabled: [Follow Button]
❌ Disabled: "This user is not accepting follow requests"
```

**Important notes:**
- Disabling this doesn't remove existing followers (they stay followers)
- You can still follow other people when this is disabled
- Existing followers retain access to followers-only content

**Best for:**
- **Enabled:** Want to grow your network, accept new followers
- **Disabled:** Don't want new followers, closed network

---

## 🎯 Common Privacy Scenarios

### Maximum Privacy
For users who want complete privacy:

```
✅ Profile Visibility: Private
☐ Show in Search Results: Disabled
✅ Saved Locations: Private
☐ Show Location on Profile: Disabled
☐ Allow Follow Requests: Disabled
```

**Result:** Nobody can see your profile, find you in search, see your locations, know your location, or follow you.

---

### Public Content Creator
For users who want maximum visibility:

```
✅ Profile Visibility: Public
✅ Show in Search Results: Enabled
✅ Saved Locations: Public
✅ Show Location on Profile: Enabled
✅ Allow Follow Requests: Enabled
```

**Result:** Everyone can find you, see your profile, view your public locations, see where you're from, and follow you.

---

### Selective Sharing (Recommended)
For users who want some privacy but still share with followers:

```
✅ Profile Visibility: Followers
✅ Show in Search Results: Enabled
✅ Saved Locations: Followers
☐ Show Location on Profile: Disabled
✅ Allow Follow Requests: Enabled
```

**Result:** Anyone can find you and follow you, but only followers see your profile and saved locations. Your location is private.

---

### Semi-Private Discovery
For users who want to be found but control access:

```
✅ Profile Visibility: Followers
☐ Show in Search Results: Disabled
✅ Saved Locations: Followers
☐ Show Location on Profile: Disabled
✅ Allow Follow Requests: Enabled
```

**Result:** You're not searchable, but people with your direct link can follow you. Only followers see your content.

---

## 📱 How to Change Your Privacy Settings

1. **Log in** to your account
2. **Click your avatar** in the top right
3. **Go to Profile Settings** or visit `/profile`
4. **Scroll to the Privacy section**
5. **Adjust settings** as desired
6. **Changes take effect immediately** (no save button needed)

## 🔄 Privacy Changes Take Effect Immediately

When you change a privacy setting, the new rules apply instantly:

**Example 1: Making profile private**
- You change Profile Visibility from "Public" to "Private"
- Someone viewing your profile right now will need to refresh
- After refresh, they see the privacy message (unless they're you)

**Example 2: Removing follower access to locations**
- You change Saved Locations from "Followers" to "Private"
- Followers viewing your profile see the privacy message immediately
- Their access is revoked in real-time

**Example 3: Someone unfollows you**
- You have Profile Visibility set to "Followers"
- Someone unfollows you while viewing your profile
- They lose access and see the privacy message

---

## ❓ Frequently Asked Questions

### Can I see who viewed my profile?
No, fotolokashen doesn't track profile views. This is for user privacy.

### If I make my profile private, can people still find my locations on the map?
No. Your locations are only visible to people who meet your privacy settings. Private profiles mean private content.

### What happens to my existing followers if I disable "Allow Follow Requests"?
They remain your followers. This setting only prevents NEW people from following you.

### Can I remove followers?
Currently, no. But you can make your profile private, which hides it from everyone including followers.

### If my profile is "Followers-only", can followers see my private locations?
No. Location visibility (public/private per location) is separate from profile privacy. Followers see your public locations only.

### Can I block specific users?
Not yet. This feature is planned for a future update. For now, use privacy settings to control access.

### Does "Show in Search Results" affect Google search?
No. This only affects the in-app user search. Your profile may still appear in Google if it's public.

### What's the difference between "Saved Locations: Private" and making individual locations private?
- **Saved Locations: Private** - Hides the locations section from your profile
- **Individual location privacy** - Controls whether each location is visible in your saved locations

You can combine both for maximum privacy.

### If I set everything to private, why would I use the app?
You can still:
- Save locations for your own reference
- Use the map to explore
- Plan trips privately
- Keep personal notes on locations

Privacy settings let you use the app as a personal tool without social features.

---

## 🛡️ Security Tips

1. **Review your settings regularly** - Check your privacy settings periodically

2. **Start private, open up later** - If unsure, start with more privacy and relax settings as needed

3. **Be selective with follows** - Only follow people you trust if you have followers-only content

4. **Check what others see** - View your profile in an incognito window to see what others see

5. **Individual location privacy** - Even with public saved locations setting, you can make specific locations private

6. **Share your direct link carefully** - Even with search disabled, anyone with `/@yourname` can access your profile (subject to visibility settings)

7. **Understand public vs. followers** - "Followers" setting requires people to follow AND be logged in to see content

---

## 📞 Need Help?

If you have questions about privacy settings:

1. Check this guide first
2. Visit our FAQ section
3. Contact support at support@fotolokashen.com

**Remember:** Your privacy is in your control. Choose the settings that work best for you!

---

**Last Updated:** January 13, 2026  
**Version:** 2.0 (Phase 2A)
