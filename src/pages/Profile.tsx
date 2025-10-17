export default function Profile() {
  return (
    <section className="profile-page">
      <div className="profile-header">
        <div className="polaroid" aria-label="Profile picture placeholder">
          <div className="polaroid-photo">
            <div className="silhouette" aria-hidden />
            <span className="camera" aria-hidden>📷</span>
          </div>
          <div className="polaroid-caption">Profile</div>
        </div>
      </div>
      <h1>My Profile</h1>
      <p>Account details and order history will live here.</p>
    </section>
  )
}
