#!/usr/bin/env python3
import sys
import os
sys.path.append('/var/www/muksta/backend')
os.chdir('/var/www/muksta/backend')

from app.database import engine
from app.models import user, post, comment, follow, like, saved_post

# Create all tables
user.Base.metadata.create_all(bind=engine)
post.Base.metadata.create_all(bind=engine)
comment.Base.metadata.create_all(bind=engine)
follow.Base.metadata.create_all(bind=engine)
like.Base.metadata.create_all(bind=engine)
saved_post.Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")