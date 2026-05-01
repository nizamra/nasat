export default function PhotosCard() {
  const dummyPhotos = [10, 20, 30, 40, 50, 60];

  return (
    <div className="card">
      <div className="flex-row space-between" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Photos</h3>
        <a href="#" className="text-link" style={{ fontSize: '14px' }}>See All</a>
      </div>
      
      <div className="photos-grid">
        {dummyPhotos.map((num) => (
          <img 
            key={num} 
            src={`https://picsum.photos/id/${num}/150/150`} 
            alt={`Gallery ${num}`} 
            className="photo-item"
          />
        ))}
      </div>
    </div>
  );
}
