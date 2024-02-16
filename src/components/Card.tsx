function Card() {
  return (
    <div className="row">
      <div className="col-sm-6 mb-3 mb-sm-0">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">BITS Pilani, Hyderabad Campus</h5>
            <p className="card-text">
              Bachelor of Engineering in Mechanical Engineering
            </p>
            <a
              href="http://www.bits-pilani.ac.in/Hyderabad/"
              className="btn btn-primary"
            >
              Visit Website
            </a>
          </div>
        </div>
      </div>
      <div className="col-sm-6">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">DAV Public School</h5>
            <p className="card-text">High School Diploma</p>
            <a href="https://davcmc.net.in/" className="btn btn-primary">
              Visit Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Card;
