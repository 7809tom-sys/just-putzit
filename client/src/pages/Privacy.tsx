export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-bold text-4xl text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: August 4, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
          {/* Introduction */}
          <section>
            <p className="text-lg leading-relaxed">
              Just Putzit, the company behind the Just Putzit platform, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
            </p>
            <p className="text-base leading-relaxed">
              Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the application.
            </p>
          </section>

          {/* Collection of Your Information */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Collection of Your Information</h2>
            <p className="mb-4">We may collect information about you in a variety of ways. The information we may collect via the Application depends on the content and materials you use and includes:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Personal Data</h3>
                <p>Personally identifiable information such as your name, shipping address, email address, and telephone number that you voluntarily give to us when you register with the Application or when you choose to participate in various activities related to the Application, such as online chat and message boards.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Derivative Data</h3>
                <p>Information our servers automatically collect when you access the Application, such as your native actions that are integral to the Application, as well as other interactions with the Application and other users via server log files.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Location Data</h3>
                <p>We may request access or permission to and track location-based information from your mobile device, either continuously or while you are using the Application, to provide location-based services. If you wish to change our access or permissions, you may do so in your device's settings.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Mobile Device Access</h3>
                <p>We may request access or permission to certain features from your mobile device, including your mobile device's camera, contacts, and other features. If you wish to change our access or permissions, you may do so in your device's settings.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Mobile Device Data</h3>
                <p>Device information such as your mobile device ID, model, and manufacturer, and information about the location of your device.</p>
              </div>
            </div>
          </section>

          {/* Use of Your Information */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Use of Your Information</h2>
            <p className="mb-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>

            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Create and manage your account</li>
              <li>Enable user-to-user communications</li>
              <li>Generate a personal profile about you to make future visits to the Application more personalized</li>
              <li>Increase the efficiency and operation of the Application</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Application</li>
              <li>Notify you of updates to the Application</li>
              <li>Offer new products, services, and/or recommendations to you</li>
              <li>Perform other business activities as needed</li>
              <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity</li>
              <li>Process payments and refunds</li>
              <li>Request feedback and contact you about your use of the Application</li>
              <li>Resolve disputes and troubleshoot problems</li>
              <li>Respond to product and customer service requests</li>
              <li>Solicit support for the Application</li>
            </ul>
          </section>

          {/* Disclosure of Your Information */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Disclosure of Your Information</h2>
            <p className="mb-4">We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">By Law or to Protect Rights</h3>
                <p>If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Third-Party Service Providers</h3>
                <p>We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Business Partners</h3>
                <p>We may share your information with our business partners to offer you certain products, services, or promotions.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Other Third Parties</h3>
                <p>We may share your information with advertisers and investors for the purpose of conducting general business analysis. We may also share your information with such third parties for marketing purposes.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Sale or Bankruptcy</h3>
                <p>If we reorganize or sell all or a portion of our assets, undergo a merger, or are acquired by another entity, we may transfer your information to the successor entity. If we go out of business or enter bankruptcy, your information would be an asset transferred or acquired by a third party. You acknowledge that such transfers may occur and that the transferee may decline to honor commitments we made in this Privacy Policy.</p>
              </div>
            </div>
          </section>

          {/* Security of Your Information */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Security of Your Information</h2>
            <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
          </section>

          {/* Policy for Children */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Policy for Children</h2>
            <p>We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible. If you become aware of any data we may have collected from children under age 13, please contact us.</p>
          </section>

          {/* Controls for Do-Not-Track Features */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Controls for Do-Not-Track Features</h2>
            <p>Most web browsers and some mobile operating systems include a Do-Not-Track feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. Because there is not yet a common understanding of how to interpret the Do-Not-Track signal, we do not currently respond to Do-Not-Track signals.</p>
          </section>

          {/* Options Regarding Your Information */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Options Regarding Your Information</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Account Information</h3>
                <p>You may at any time review or change the information in your account or terminate your account by logging into your account settings and updating your account, contacting us using the contact information provided below, or deleting your account. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms, and comply with legal requirements.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Emails and Communications</h3>
                <p>If you no longer wish to receive correspondence, emails, or other communications from us, you may opt-out by contacting us using the contact information provided below. If you no longer wish to receive correspondence, emails, or other communications from third parties, you are responsible for contacting the third party directly.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">California Privacy Rights</h3>
                <p>California Civil Code Section 1798.83 permits our users who are California residents to request certain information regarding our disclosure of personal information to third parties for their direct marketing purposes. To make such a request, please send an email to or write us at the address listed below.</p>
              </div>
            </div>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">Contact Us</h2>
            <p className="mb-4">If you have questions or comments about this Privacy Policy, please contact us at:</p>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="font-semibold text-foreground">Just Putzit</p>
              <p className="text-muted-foreground">Email: support@justputzit.com</p>
              <p className="text-muted-foreground">Website: www.justputzit.com</p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="border-t border-border pt-6 mt-8">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ <strong>Legal Disclaimer:</strong> This Privacy Policy is a template. Please have a lawyer review it before using it in production. This policy should be customized to reflect your specific data practices and comply with applicable laws in your jurisdiction.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
