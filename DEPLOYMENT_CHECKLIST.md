# 📋 Deployment Checklist

Use this checklist to ensure a smooth deployment.

## ✅ Pre-Deployment

### Code Preparation
- [ ] All features are working locally
- [ ] No console errors in browser
- [ ] Build succeeds: `npm run build`
- [ ] Production build works: `npm start`
- [ ] Pre-deployment check passes: `node pre-deploy-check.mjs`

### Environment Setup
- [ ] `.env.local` has all required variables
- [ ] MongoDB URI is from Atlas (not localhost)
- [ ] Google OAuth credentials are correct
- [ ] Gemini API keys are valid
- [ ] `.env` files are in `.gitignore`

### Version Control
- [ ] Git repository initialized
- [ ] All changes committed
- [ ] Pushed to GitHub/GitLab/Bitbucket (if using)
- [ ] No sensitive data in commits

## 🚀 Deployment

### Platform Setup
- [ ] Vercel/Netlify/Railway account created
- [ ] Project imported or created
- [ ] Build settings configured
- [ ] Environment variables added

### Deployment Process
- [ ] Initial deployment successful
- [ ] No build errors
- [ ] Deployment URL received
- [ ] Site is accessible

## 🔧 Post-Deployment

### Configuration
- [ ] Google OAuth redirect URIs updated with production URL
- [ ] Authorized JavaScript origins added
- [ ] SSL/HTTPS is enabled (automatic on Vercel)
- [ ] Custom domain configured (if applicable)

### Admin Setup
- [ ] Visited `/api/auth/create-admin`
- [ ] Admin account created successfully
- [ ] Logged in as admin
- [ ] Changed default admin password
- [ ] Admin dashboard accessible

### Testing
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Profile page accessible
- [ ] Profile image upload works
- [ ] Research tools functional
- [ ] Citation manager works
- [ ] Export features work (PDF, DOCX, etc.)
- [ ] Admin features work:
  - [ ] View all users
  - [ ] Edit user details
  - [ ] Change user roles
  - [ ] View user activity
  - [ ] Reset passwords
  - [ ] Suspend/Ban users
  - [ ] Delete users

### Performance
- [ ] Page load times are acceptable
- [ ] Images load quickly
- [ ] API responses are fast
- [ ] No timeout errors
- [ ] Database queries are efficient

### Security
- [ ] HTTPS is enforced
- [ ] Environment variables are secure
- [ ] No API keys in client-side code
- [ ] Admin password changed from default
- [ ] MongoDB has strong password
- [ ] IP whitelist configured (if needed)

## 📊 Monitoring

### Setup Monitoring
- [ ] Vercel analytics enabled
- [ ] Error tracking configured
- [ ] MongoDB monitoring enabled
- [ ] API usage tracking set up

### Regular Checks
- [ ] Check deployment logs regularly
- [ ] Monitor API rate limits
- [ ] Review error reports
- [ ] Check database performance

## 🔄 Maintenance

### Backups
- [ ] MongoDB automatic backups enabled
- [ ] Code backed up to Git
- [ ] Environment variables documented
- [ ] Deployment configuration saved

### Updates
- [ ] Plan for dependency updates
- [ ] Monitor security advisories
- [ ] Test updates in preview before production
- [ ] Keep documentation updated

## 📞 Support Contacts

### Platform Support
- Vercel: https://vercel.com/support
- MongoDB Atlas: https://support.mongodb.com
- Google Cloud: https://cloud.google.com/support

### Documentation
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- MongoDB: https://docs.mongodb.com

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ All checklist items are completed
- ✅ No errors in production
- ✅ All features work as expected
- ✅ Users can register and login
- ✅ Admin can manage users
- ✅ Research tools are functional
- ✅ Performance is acceptable

## 📝 Notes

Use this space to track deployment-specific information:

**Deployment Date**: _______________

**Production URL**: _______________

**Admin Email**: _______________

**MongoDB Cluster**: _______________

**Issues Encountered**: 
- 
- 
- 

**Resolutions**:
- 
- 
- 

---

**Status**: 
- [ ] Pre-Deployment Complete
- [ ] Deployment Complete
- [ ] Post-Deployment Complete
- [ ] Testing Complete
- [ ] Production Ready ✅

---

**Last Updated**: _______________

**Deployed By**: _______________
