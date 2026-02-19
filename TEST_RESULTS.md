# Test Post Generation - IWA/IWP Brand Voice Validation

## Test 1: IWP - New Episode
**Topic:** Interview with Master of Wine Sarah Heller about Asian wine market

**Expected Output Structure:**
```
🎙Ep. 2615 of the #ItalianWinePodcast

Today Marc speaks with Master of Wine Sarah Heller about the evolving wine market in Asia.

They explore:
🌏 The growing appetite for Italian wine in Hong Kong and Singapore
🍷 How Asian consumers approach wine differently
🥢 Food pairing trends that are shaping the market

Sarah brings her unique perspective as an MW based in Hong Kong.

Tune in wherever you get your podcasts! 🎧

#ItalianWinePodcast #WinePeople #MasterOfWine #AsianWineMarket
```

## Test 2: IWA - Course Launch
**Topic:** WSET Level 2 course starting March 15, 2026 with Cynthia Chaplin

**Expected Output Structure:**
```
🍷 WSET Level 2 Award in Wines is coming to Verona!

📅 March 15-17, 2026
📍 Italian Wine Academy headquarters
🎓 With educator Cynthia Chaplin

Take your wine knowledge to the next level with our intensive 3-day course. You'll taste over 40 wines from around the world.

Perfect for wine enthusiasts ready to go deeper.

🔗 Link in bio to register

#ItalianWineAcademy #WSET #WSETLevel2 #WineEducation #Verona
```

## Color Palette Verification

### IWA Colors (CSS Variables)
- ✅ --wset-purple: #5C2D91
- ✅ --vinitaly-red: #C8102E
- ✅ --champagne-gold: #D4AF37
- ✅ --warm-white: #FAF9F6
- ✅ --deep-charcoal: #2D2D2D
- ✅ --wine-red: #722F37

### IWP Colors (CSS Variables)
- ✅ --iwp-primary: #CD212A (Italian Red)
- ✅ Wine Purple: #4A0E4E

## Image Prompt Specifications

### IWA Image Prompts
- Modern minimalist graphic design
- WSET Purple (#5C2D91) + Champagne Gold (#D4AF37) + Warm White (#FAF9F6)
- Clean flat design, sans-serif bold uppercase (Montserrat/Helvetica Neue)
- Geometric shapes, NOT photos

### IWP Image Prompts
- Warm editorial wine photography
- Italian Green (#008C45) + Italian Red (#CD212A) + Wine Purple (#4A0E4E)
- Golden hour lighting 5500-6000K
- Authentic Italian settings, human element
- Photorealistic, NOT stock photography

## Commit Summary
- Commit: 63c8b68
- Message: "fix: IWA/IWP brand colors and voice - Perfect palette match"
- Files changed: 4 files, 325 insertions(+), 224 deletions(-)

## Deploy URL
https://ai-social-media-cockpit-gcwl3vopi-anselmos-projects-c2149e27.vercel.app
