"""
시간대 관련 유틸리티
"""
from datetime import datetime
import pytz

# 한국 시간대
KST = pytz.timezone('Asia/Seoul')

def get_kst_now():
    """현재 한국 시간 반환"""
    return datetime.now(KST)

def utc_to_kst(utc_dt):
    """UTC 시간을 한국 시간으로 변환"""
    if utc_dt is None:
        return None
    if utc_dt.tzinfo is None:
        utc_dt = pytz.utc.localize(utc_dt)
    return utc_dt.astimezone(KST)

def kst_to_utc(kst_dt):
    """한국 시간을 UTC로 변환"""
    if kst_dt is None:
        return None
    if kst_dt.tzinfo is None:
        kst_dt = KST.localize(kst_dt)
    return kst_dt.astimezone(pytz.utc)