// Update the profile image rendering
<img
  src={request.user?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${request.user?.full_name}&backgroundColor=1d1918&textColor=e8e4dc`}
  alt={request.user?.full_name}
  className="w-12 h-12 rounded-lg object-cover bg-earth-800"
/>