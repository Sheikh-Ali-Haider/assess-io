from services.database import SessionLocal, User, create_tables
import bcrypt

create_tables()

db = SessionLocal()

existing = db.query(User).filter(User.email == "admin@assess.io").first()
if existing:
    print("✅ Admin already exists — login with admin@assess.io")
else:
    hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    admin = User(
        name     = "Admin",
        email    = "admin@assess.io",
        password = hashed,
        role     = "admin",
    )
    db.add(admin)
    db.commit()
    print("✅ Admin created successfully!")
    print("   Email:    admin@assess.io")
    print("   Password: admin123")

db.close()