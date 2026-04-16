import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FieldStatus = "required" | "optional"
type FieldInputType = "text" | "rich-text" | "plain-text" | "date" | "date-range" | "boolean" | "link" | "email" | "phone" | "number" | "dropdown" | "address" | "geofield" | "file" | "content-ref" | "taxonomy" | "media-image" | "media-doc"

interface Field {
  label: string; machine: string; hint: string; status: FieldStatus; type: FieldInputType; multiple?: boolean
}
interface ContentType {
  id: string; name: string; machine: string; group: string; icon: string; color: string; description: string;
  note?: { kind: "info" | "warn" | "tip"; text: string }; taxonomyNote?: string; fields: Field[]
}
interface TaxonomyVocab { name: string; machine: string; terms?: string[]; note?: string }

const CONTENT_TYPES: ContentType[] = [
  { id:"newsroom", name:"Newsroom", machine:"newsroom", group:"Newsroom & Media", icon:"📰", color:"#FDE8E8",
    description:"The main content type for all news-related posts — press releases, events, announcements, workshops, ST statements, and media articles.",
    note:{kind:"tip",text:"Always set <strong>News Type</strong> and <strong>Publish Date</strong> — these are required for the post to appear in the right section."},
    taxonomyNote:"News Type controls where this post appears. Options: Press Releases, Announcement / Notice, ST Statements, ST@Media, Media Articles, Events, Workshops, News",
    fields:[
      {label:"Title",machine:"title",hint:"The headline of the article or announcement.",status:"required",type:"text"},
      {label:"Publish Date",machine:"field_publish_date",hint:"The official date shown as 'Issued' on the listing page.",status:"required",type:"date"},
      {label:"News Type",machine:"field_news_type",hint:"Pick a category (e.g. Events, Press Releases). Determines which section it appears under in Newsroom.",status:"required",type:"taxonomy"},
      {label:"Description",machine:"field_description",hint:"Short teaser text for listing cards. Plain text only.",status:"optional",type:"plain-text"},
      {label:"Content",machine:"field_content",hint:"Main body of the article. Supports rich text, images, and formatting.",status:"optional",type:"rich-text"},
      {label:"Featured Image",machine:"field_featured_image",hint:"Main image shown on listing cards and article header. Upload from Media library.",status:"optional",type:"media-image"},
      {label:"File / Attachment",machine:"field_file",hint:"Attach a PDF (e.g. press release document). Shown as a download button.",status:"optional",type:"media-doc"},
      {label:"Location",machine:"field_location",hint:"For Events only — enter the venue or city (e.g. Putrajaya).",status:"optional",type:"plain-text"},
      {label:"External Links",machine:"field_external_links",hint:"Link to an external source. Enter the URL and a display label.",status:"optional",type:"link"},
      {label:"Featured",machine:"field_featured",hint:"Tick to feature this post as the large hero card in the News section.",status:"optional",type:"boolean"},
      {label:"Tags",machine:"field_tags",hint:"Add tags to group related content. Multiple tags allowed.",status:"optional",type:"taxonomy",multiple:true},
    ]},
  { id:"highlights", name:"Highlights", machine:"highlights", group:"Newsroom & Media", icon:"⭐", color:"#FFF3E0",
    description:"Featured stories shown in the Highlights carousel on the homepage. Used for high-priority content needing extra visibility.",
    fields:[
      {label:"Title",machine:"title",hint:"Headline for the highlight card.",status:"required",type:"text"},
      {label:"Body",machine:"field_body",hint:"Main content. Supports rich text and a short summary.",status:"optional",type:"rich-text"},
      {label:"Featured Image",machine:"field_featured_image",hint:"Visual image shown on the highlight card. Use a high-quality landscape image.",status:"optional",type:"media-image"},
      {label:"Links",machine:"field_links",hint:"Call-to-action links (e.g. 'Read more', 'Register here'). Multiple links allowed.",status:"optional",type:"link",multiple:true},
      {label:"Tags",machine:"field_h_tags",hint:"Assign a Highlights Tag to categorise this highlight internally.",status:"optional",type:"taxonomy"},
    ]},
  { id:"faq", name:"FAQ", machine:"faq", group:"Knowledge & Resources", icon:"❓", color:"#E8F7EE",
    description:"Frequently asked questions. Each entry is a single question-and-answer pair, organised by category and topic.",
    note:{kind:"info",text:"<strong>FAQ Category</strong> and <strong>Topic Tag</strong> control how this FAQ is grouped and filtered on the FAQ page. Both can have multiple values."},
    fields:[
      {label:"Title (Question)",machine:"title",hint:"Write as a full question, e.g. 'How do I apply for a license?'",status:"required",type:"text"},
      {label:"Answer",machine:"field_answers",hint:"The full answer. Supports rich text, tables, and links.",status:"optional",type:"rich-text"},
      {label:"Question (Long)",machine:"field_question_long",hint:"Use when the question needs more context or multi-line explanation.",status:"optional",type:"plain-text"},
      {label:"Question with Images",machine:"field_question_with_images",hint:"Use when the question needs supporting diagrams or charts.",status:"optional",type:"rich-text"},
      {label:"FAQ Category",machine:"field_faq_category",hint:"Assign categories. Appears as filter tabs on the FAQ page. Multiple allowed.",status:"optional",type:"taxonomy",multiple:true},
      {label:"Topic Tag",machine:"field_topic_tag",hint:"Assigns this FAQ to a section in the FAQ hierarchy.",status:"optional",type:"taxonomy"},
      {label:"Topic Reference",machine:"field_topic_reference",hint:"Link to a related Topic page on the site.",status:"optional",type:"content-ref"},
      {label:"File Attachment",machine:"field_file_attachment",hint:"Attach supporting documents (PDFs, forms). Multiple files allowed.",status:"optional",type:"media-doc",multiple:true},
      {label:"External Links",machine:"field_external_links",hint:"Link to an external resource relevant to this FAQ.",status:"optional",type:"link"},
    ]},
  { id:"resource", name:"Resource", machine:"resource", group:"Knowledge & Resources", icon:"📄", color:"#EEF2F7",
    description:"Downloadable publications, reports, and magazines. Appears in Publications and Resources listing pages.",
    fields:[
      {label:"Title",machine:"title",hint:"Publication title, e.g. 'Energy Malaysia, Volume 27, 2025'.",status:"required",type:"text"},
      {label:"Summary",machine:"field_summary",hint:"Short description shown on listing cards.",status:"optional",type:"plain-text"},
      {label:"Resource Type",machine:"field_resource_type",hint:"Select the type (e.g. Magazine, Annual Report). Shown as a badge on the card.",status:"optional",type:"taxonomy"},
      {label:"Publication Date",machine:"field_publication_date",hint:"The official date this resource was issued.",status:"optional",type:"date"},
      {label:"Cover Image",machine:"field_featured_image",hint:"Upload the cover thumbnail shown on listing cards.",status:"optional",type:"media-image"},
      {label:"File",machine:"field_file",hint:"Upload the PDF or document for download.",status:"optional",type:"media-doc"},
      {label:"External Link",machine:"field_external_links",hint:"Use if the resource is hosted externally instead of uploaded.",status:"optional",type:"link"},
      {label:"Topic Reference",machine:"field_topic_reference",hint:"Link to a related section/topic page on the site.",status:"optional",type:"content-ref"},
    ]},
  { id:"policies", name:"Policies", machine:"policies", group:"Knowledge & Resources", icon:"📋", color:"#FDE8E8",
    description:"Official regulatory policies, guidelines, and frameworks with attachments.",
    fields:[
      {label:"Title",machine:"title",hint:"Name of the policy or guideline.",status:"required",type:"text"},
      {label:"Description",machine:"field_body",hint:"Full description or content. Supports rich text and a summary.",status:"optional",type:"rich-text"},
      {label:"Policy Category",machine:"field_policy_categories",hint:"Assign to the relevant category for grouping and filtering.",status:"optional",type:"taxonomy"},
      {label:"Featured Image",machine:"field_featured_image",hint:"Optional cover image for this policy entry.",status:"optional",type:"media-image"},
      {label:"File Attachment",machine:"field_file_attachment",hint:"Attach the policy document(s) for download. Multiple files allowed.",status:"optional",type:"media-doc",multiple:true},
    ]},
  { id:"consultation_hub", name:"Consultation Hub", machine:"consultation_hub", group:"Knowledge & Resources", icon:"🤝", color:"#E8F7EE",
    description:"Public consultation documents and regulatory notices requiring attached key documents.",
    fields:[
      {label:"Title",machine:"title",hint:"Title of the consultation document or notice.",status:"required",type:"text"},
      {label:"Body",machine:"field_body",hint:"Full content of the consultation. Supports rich text and a summary.",status:"optional",type:"rich-text"},
      {label:"Key Documents",machine:"field_key_documents",hint:"Upload the consultation documents. Multiple files allowed.",status:"optional",type:"media-doc",multiple:true},
    ]},
  { id:"topic", name:"Topic", machine:"topic", group:"Knowledge & Resources", icon:"🗂️", color:"#EEF2F7",
    description:"Sub-pages that sit under a main Page. Used to organise detailed subject areas under a parent section.",
    fields:[
      {label:"Title",machine:"title",hint:"Name of the topic.",status:"required",type:"text"},
      {label:"Introduction",machine:"field_introduction",hint:"Brief intro paragraph shown at the top of the page.",status:"optional",type:"plain-text"},
      {label:"Parent Page",machine:"field_parent",hint:"Link this topic to its parent Page (the main section it belongs under).",status:"optional",type:"content-ref"},
      {label:"File Attachment",machine:"field_file_attachment",hint:"Attach any supporting documents. Multiple files allowed.",status:"optional",type:"media-doc",multiple:true},
    ]},
  { id:"page", name:"Page", machine:"page", group:"Pages & Navigation", icon:"🖼️", color:"#F0EDE8",
    description:"Main section landing pages and standalone content pages (e.g. Stakeholders, Security). Layout managed via Layout Builder.",
    note:{kind:"warn",text:"This content type uses <strong>Layout Builder</strong>. Avoid editing the Layout section — contact the dev team for structural page changes."},
    fields:[
      {label:"Title",machine:"title",hint:"Page title shown as the main heading.",status:"required",type:"text"},
      {label:"Description",machine:"field_description",hint:"Short descriptive text used in SEO and page intros.",status:"required",type:"plain-text"},
      {label:"Content",machine:"field_content",hint:"Main body content in rich text.",status:"optional",type:"rich-text"},
      {label:"Featured Image",machine:"field_featured_image",hint:"Hero or banner image for the page.",status:"optional",type:"media-image"},
      {label:"Links",machine:"field_links",hint:"Additional links shown on the page. Multiple allowed.",status:"optional",type:"link",multiple:true},
      {label:"Tags",machine:"field_tags",hint:"Tag this page for grouping with related content.",status:"optional",type:"taxonomy",multiple:true},
    ]},
  { id:"page_with_links", name:"Page with Links", machine:"page_with_links", group:"Pages & Navigation", icon:"🔗", color:"#FEF9E7",
    description:"A lighter page type for sections that are primarily a curated list of links with a short intro.",
    fields:[
      {label:"Title",machine:"title",hint:"Page title.",status:"required",type:"text"},
      {label:"Introduction",machine:"field_intro",hint:"Short formatted intro paragraph shown at the top.",status:"optional",type:"rich-text"},
      {label:"Long Introduction",machine:"field_long_introduction",hint:"More detailed intro if needed.",status:"optional",type:"rich-text"},
      {label:"External Links",machine:"field_links",hint:"The list of links shown on this page. Multiple allowed.",status:"optional",type:"link",multiple:true},
    ]},
  { id:"about_us", name:"About Us", machine:"about_us", group:"Pages & Navigation", icon:"🏢", color:"#FDE8E8",
    description:"Content for the About Us section pages — organisational background, mission, and vision.",
    fields:[
      {label:"Title",machine:"title",hint:"Section title.",status:"required",type:"text"},
      {label:"Body",machine:"field_body",hint:"Main content with rich text and optional summary.",status:"optional",type:"rich-text"},
      {label:"Image",machine:"field_image",hint:"Supporting image for this About Us section.",status:"optional",type:"media-image"},
    ]},
  { id:"quicklinks", name:"Quicklinks", machine:"quicklinks", group:"Pages & Navigation", icon:"⚡", color:"#E8F7EE",
    description:"External agency or partner links shown in the Quicklinks section on the homepage, grouped by category.",
    fields:[
      {label:"Agency Name",machine:"title",hint:"Name of the agency or organisation.",status:"required",type:"text"},
      {label:"Description",machine:"field_description",hint:"One-line description shown below the agency name.",status:"optional",type:"plain-text"},
      {label:"Logo",machine:"field_logo",hint:"Upload the agency logo used as the thumbnail.",status:"optional",type:"media-image"},
      {label:"Link",machine:"field_links",hint:"URL of the agency website. Multiple links allowed.",status:"optional",type:"link",multiple:true},
      {label:"Quicklink Category",machine:"field_quicklink_category",hint:"Which group this belongs to (e.g. Government & Policy, National Energy Utilities).",status:"optional",type:"taxonomy"},
      {label:"Topic",machine:"field_topic",hint:"Link to a related page/topic on the site if applicable.",status:"optional",type:"content-ref"},
    ]},
  { id:"management_team", name:"Management Team", machine:"management_team", group:"People & Organisation", icon:"👤", color:"#EEF2F7",
    description:"Profiles for senior management and leadership team members shown in the Leadership section.",
    fields:[
      {label:"Full Name",machine:"title",hint:"The person's full name.",status:"required",type:"text"},
      {label:"Profile Picture",machine:"field_profile_picture",hint:"Headshot photo. Use a consistent portrait format.",status:"optional",type:"media-image"},
      {label:"Position / Title",machine:"field_positions",hint:"Select the job title from the Positions list.",status:"optional",type:"taxonomy"},
      {label:"Division",machine:"field_division",hint:"Select the division this person belongs to.",status:"optional",type:"taxonomy"},
      {label:"Description / Bio",machine:"field_body",hint:"Biography or description. Supports rich text and a short summary.",status:"optional",type:"rich-text"},
      {label:"Email Address",machine:"field_email_address",hint:"Official email address.",status:"optional",type:"email"},
    ]},
  { id:"energy_commission_members", name:"EC Members", machine:"energy_commission_members", group:"People & Organisation", icon:"🎖️", color:"#FDE8E8",
    description:"Profiles for appointed Energy Commission board members. Includes an appointment date.",
    fields:[
      {label:"Full Name",machine:"title",hint:"The member's full name.",status:"required",type:"text"},
      {label:"Profile Picture",machine:"field_profile_picture",hint:"Headshot photo in portrait format.",status:"optional",type:"media-image"},
      {label:"Position / Title",machine:"field_positions",hint:"Select the member's role/title from the Positions list.",status:"optional",type:"taxonomy"},
      {label:"Date of Appointment",machine:"field_date_of_appointment",hint:"Enter the official appointment date as plain text (e.g. '1 January 2023').",status:"optional",type:"plain-text"},
      {label:"Description / Bio",machine:"field_body",hint:"Biography or description. Supports rich text and a short summary.",status:"optional",type:"rich-text"},
    ]},
  { id:"staff", name:"Staff", machine:"staff", group:"People & Organisation", icon:"👥", color:"#F0EDE8",
    description:"Staff directory entries for ST employees. Used for internal contact listings.",
    fields:[
      {label:"Full Name",machine:"title",hint:"The staff member's full name.",status:"required",type:"text"},
      {label:"Position",machine:"field_positions",hint:"Select from the Positions taxonomy.",status:"optional",type:"taxonomy"},
      {label:"Division",machine:"field_division",hint:"Select the division this person belongs to.",status:"optional",type:"taxonomy"},
      {label:"Section",machine:"field_section",hint:"Select the specific section within the division.",status:"optional",type:"taxonomy"},
      {label:"Email Address",machine:"field_email_address",hint:"Official ST email address.",status:"optional",type:"email"},
      {label:"Telephone",machine:"field_telephone",hint:"Direct phone number including extension.",status:"optional",type:"phone"},
    ]},
  { id:"section_contact", name:"Section Contact", machine:"section_contact", group:"People & Organisation", icon:"📧", color:"#E8F7EE",
    description:"Contact information for a specific department or section.",
    fields:[
      {label:"Section Name",machine:"title",hint:"Name of the section or department.",status:"required",type:"text"},
      {label:"Division",machine:"field_division",hint:"Select the division this contact belongs to.",status:"optional",type:"taxonomy"},
      {label:"Email Address",machine:"field_email_address",hint:"Contact email for this section.",status:"optional",type:"email"},
    ]},
  { id:"career", name:"Career", machine:"career", group:"Procurement & Licensing", icon:"💼", color:"#FEF9E7",
    description:"Job vacancy and career opportunity postings with application date range and attachments.",
    fields:[
      {label:"Job Title",machine:"title",hint:"Name of the position or vacancy.",status:"required",type:"text"},
      {label:"Overview",machine:"field_overview",hint:"Full job description and requirements. Supports rich text.",status:"optional",type:"rich-text"},
      {label:"Application Period",machine:"field_date_range",hint:"Set the opening and closing dates for applications.",status:"optional",type:"date-range"},
      {label:"Attachment",machine:"field_file_attachment",hint:"Upload related documents (job description PDF, application form). Multiple allowed.",status:"optional",type:"media-doc",multiple:true},
    ]},
  { id:"tender_quotation", name:"Tender / Quotation", machine:"tender_quotation", group:"Procurement & Licensing", icon:"📑", color:"#FDE8E8",
    description:"Procurement tender and quotation notices with reference codes, dates, and attachments.",
    fields:[
      {label:"Title",machine:"title",hint:"Full name or description of the tender/quotation.",status:"required",type:"text"},
      {label:"Reference Code",machine:"field_code",hint:"Official reference number (e.g. ST/PRO/2026/001).",status:"optional",type:"plain-text"},
      {label:"Type",machine:"field_type",hint:"Select whether this is a Tender or Quotation.",status:"optional",type:"dropdown"},
      {label:"Submission Period",machine:"field_start_and_end_date",hint:"Opening and closing dates for submission.",status:"optional",type:"date-range"},
      {label:"Notice Date",machine:"field_notice_date",hint:"Date the notice was officially issued.",status:"optional",type:"date"},
      {label:"Collection Date",machine:"field_collection_date",hint:"Deadline for document collection if applicable.",status:"optional",type:"date"},
      {label:"Advertisement Doc",machine:"field_ad_attachment",hint:"Upload the tender/quotation advertisement document.",status:"optional",type:"file"},
      {label:"Notice Document",machine:"field_notice_attachment",hint:"Upload the official notice document.",status:"optional",type:"file"},
    ]},
  { id:"public_distribution_licensee", name:"Public Distribution Licensee", machine:"public_distribution_licensee", group:"Procurement & Licensing", icon:"⚡", color:"#EEF2F7",
    description:"Registry entries for licensed public electricity distribution companies.",
    fields:[
      {label:"Licensee Name",machine:"title",hint:"Full legal name of the licensee company.",status:"required",type:"text"},
      {label:"Address",machine:"field_licensee_address",hint:"Registered business address.",status:"optional",type:"plain-text"},
      {label:"Capacity (MW)",machine:"field_capacity",hint:"Licensed distribution capacity in megawatts. Enter as a number.",status:"optional",type:"number"},
      {label:"License Start Date",machine:"field_start_date",hint:"Date the license was granted.",status:"optional",type:"date"},
      {label:"License End Date",machine:"field_end_date",hint:"Date the license expires.",status:"optional",type:"date"},
    ]},
  { id:"office_locations", name:"Office Locations", machine:"office_locations", group:"Location", icon:"📍", color:"#FEF9E7",
    description:"ST office and branch contact details including address, phone, email, operating hours, and map pin.",
    fields:[
      {label:"Office Name",machine:"title",hint:"Name of the office or branch (e.g. 'ST Putrajaya HQ').",status:"required",type:"text"},
      {label:"Address",machine:"field_address",hint:"Full street address (street, city, postcode, state).",status:"optional",type:"address"},
      {label:"Telephone",machine:"field_telephone",hint:"Main phone number for this office.",status:"optional",type:"phone"},
      {label:"Fax",machine:"field_fax",hint:"Fax number if applicable.",status:"optional",type:"phone"},
      {label:"Email Address",machine:"field_email_address",hint:"Contact email for this office.",status:"optional",type:"email"},
      {label:"Operating Hours",machine:"field_operating_hours",hint:"E.g. 'Monday – Friday: 8:00am – 5:00pm'.",status:"optional",type:"plain-text"},
      {label:"Office Type",machine:"field_office_type",hint:"Select the type of office (HQ, Regional, Branch).",status:"optional",type:"taxonomy"},
      {label:"State",machine:"field_state",hint:"Select the Malaysian state this office is in.",status:"optional",type:"taxonomy"},
      {label:"Map Coordinates",machine:"field_lat_long",hint:"Latitude/longitude for the map pin. Contact dev team if unsure.",status:"optional",type:"geofield"},
    ]},
]

const TAXONOMY: TaxonomyVocab[] = [
  {name:"News Type",machine:"news_type",terms:["Press Releases","Announcement / Notice","ST Statements","ST@Media","Media Articles","Events","Workshops","News"]},
  {name:"FAQ Category",machine:"faq_category",note:"Appears as filter tabs on the FAQ page"},
  {name:"FAQ Hierarchy",machine:"faq_hierarchy",note:"Controls FAQ grouping levels / parent-child structure"},
  {name:"Resource Type",machine:"resource_type",terms:["Magazine","Annual Report","Guidelines","..."]},
  {name:"Policy Categories",machine:"policy_categories",note:"Groups policy entries by topic area"},
  {name:"Quicklink Category",machine:"quicklink_category",terms:["Government & Policy","National Energy Utilities","..."]},
  {name:"Positions",machine:"positions",note:"Job titles for Staff and Management profiles"},
  {name:"Staff Division",machine:"staff_division",note:"ST internal divisions"},
  {name:"Staff Section",machine:"staff_section",note:"Sub-sections within a division"},
  {name:"Office Type",machine:"office_type",terms:["HQ","Regional","Branch"]},
  {name:"State",machine:"state",note:"Malaysian states for office location filtering"},
  {name:"Highlights Tags",machine:"highlights_tags",note:"Internal tags for Highlights content"},
  {name:"Tags",machine:"tags",note:"General-purpose tags used across content types"},
]

const GROUPS = [...new Set(CONTENT_TYPES.map(ct => ct.group))]

const TYPE_META: Record<FieldInputType, {label:string;color:string}> = {
  "text":        {label:"Text",        color:"bg-slate-100 text-slate-600"},
  "rich-text":   {label:"Rich Text",   color:"bg-indigo-50 text-indigo-600"},
  "plain-text":  {label:"Plain Text",  color:"bg-slate-100 text-slate-600"},
  "date":        {label:"Date",        color:"bg-sky-50 text-sky-600"},
  "date-range":  {label:"Date Range",  color:"bg-sky-50 text-sky-600"},
  "boolean":     {label:"Checkbox",    color:"bg-violet-50 text-violet-600"},
  "link":        {label:"Link",        color:"bg-blue-50 text-blue-600"},
  "email":       {label:"Email",       color:"bg-teal-50 text-teal-600"},
  "phone":       {label:"Phone",       color:"bg-teal-50 text-teal-600"},
  "number":      {label:"Number",      color:"bg-orange-50 text-orange-600"},
  "dropdown":    {label:"Dropdown",    color:"bg-purple-50 text-purple-600"},
  "address":     {label:"Address",     color:"bg-lime-50 text-lime-600"},
  "geofield":    {label:"Geofield",    color:"bg-lime-50 text-lime-600"},
  "file":        {label:"File",        color:"bg-amber-50 text-amber-600"},
  "content-ref": {label:"Content Ref", color:"bg-rose-50 text-rose-600"},
  "taxonomy":    {label:"Taxonomy",    color:"bg-blue-50 text-blue-700"},
  "media-image": {label:"Media: Image",color:"bg-yellow-50 text-yellow-700"},
  "media-doc":   {label:"Media: Doc",  color:"bg-amber-50 text-amber-700"},
}

function TypeChip({type}:{type:FieldInputType}) {
  const {label,color} = TYPE_META[type]
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>{label}</span>
}

function StatusBadge({status}:{status:FieldStatus}) {
  return status === "required"
    ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 whitespace-nowrap">Required</span>
    : <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap">Optional</span>
}

function Callout({kind,text}:{kind:"info"|"warn"|"tip";text:string}) {
  const s = {
    info:{bg:"bg-blue-50 border-blue-200",txt:"text-blue-800",icon:"ℹ️"},
    warn:{bg:"bg-amber-50 border-amber-200",txt:"text-amber-800",icon:"⚠️"},
    tip: {bg:"bg-emerald-50 border-emerald-200",txt:"text-emerald-800",icon:"✅"},
  }[kind]
  return (
    <div className={`flex gap-2.5 p-3 rounded-lg border text-[13px] mb-3 ${s.bg} ${s.txt}`}>
      <span>{s.icon}</span>
      <span dangerouslySetInnerHTML={{__html:text}}/>
    </div>
  )
}

function FieldRow({field}:{field:Field}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <td className="py-3 pr-4 align-top w-[200px]">
        <div className="font-medium text-slate-800 text-[13px] leading-snug">{field.label}</div>
        <code className="text-[10px] text-slate-400 font-mono mt-0.5 block">{field.machine}</code>
        {field.multiple && <span className="text-[10px] text-slate-400 block mt-0.5">↳ multiple values</span>}
      </td>
      <td className="py-3 pr-4 align-top text-[13px] text-slate-500 leading-relaxed">{field.hint}</td>
      <td className="py-3 pr-3 align-top w-[90px]"><StatusBadge status={field.status}/></td>
      <td className="py-3 align-top w-[130px]"><TypeChip type={field.type}/></td>
    </tr>
  )
}

function CTCard({ct}:{ct:ContentType}) {
  const req = ct.fields.filter(f=>f.status==="required").length
  return (
    <AccordionItem value={ct.id} className="border border-slate-200 rounded-xl mb-2.5 overflow-hidden shadow-sm hover:shadow-md transition-all bg-white">
      <AccordionTrigger className="px-5 py-4 hover:bg-slate-50/60 hover:no-underline [&[data-state=open]]:bg-slate-50/60 transition-colors">
        <div className="flex items-start gap-3 text-left w-full pr-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 mt-0.5" style={{background:ct.color}}>{ct.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-[15px]">{ct.name}</span>
              <code className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{ct.machine}</code>
            </div>
            <p className="text-[13px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{ct.description}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
            <span className="text-[11px] px-2 py-0.5 bg-red-50 text-red-500 rounded-full font-semibold">{req} req</span>
            <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{ct.fields.length - req} opt</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5 pt-1">
        {ct.note && <Callout kind={ct.note.kind} text={ct.note.text}/>}
        {ct.taxonomyNote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-[13px] text-blue-800">
            <span className="font-semibold">📂 News Type: </span>{ct.taxonomyNote}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 w-[200px]">Field</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2">What to fill in</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 w-[90px]">Status</th>
                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 w-[130px]">Input type</th>
              </tr>
            </thead>
            <tbody>
              {ct.fields.map(f=><FieldRow key={f.machine} field={f}/>)}
            </tbody>
          </table>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default function App() {
  const [search, setSearch] = useState("")
  const [activeGroup, setActiveGroup] = useState("all")

  const filtered = useMemo(()=>{
    const q = search.toLowerCase()
    return CONTENT_TYPES.filter(ct=>{
      const matchGroup = activeGroup==="all"||ct.group===activeGroup
      const matchSearch = !q||[ct.name,ct.machine,ct.description,...ct.fields.map(f=>f.label+f.hint+f.machine)].join(" ").toLowerCase().includes(q)
      return matchGroup&&matchSearch
    })
  },[search,activeGroup])

  const grouped = useMemo(()=>{
    const out:Record<string,ContentType[]> = {}
    for(const ct of filtered){
      if(!out[ct.group]) out[ct.group]=[]
      out[ct.group].push(ct)
    }
    return out
  },[filtered])

  const totalReq = CONTENT_TYPES.flatMap(ct=>ct.fields).filter(f=>f.status==="required").length
  const showTaxonomy = activeGroup==="all" && !search

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 bg-[#1a3a5c] rounded-md flex items-center justify-center text-white text-xs font-bold">ST</div>
            <span className="font-bold text-[#1a3a5c] text-[15px]">st.gov.my</span>
            <span className="text-slate-300 text-sm">·</span>
            <span className="text-slate-500 text-[13px]">Content Management Guide</span>
          </div>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 h-5">Drupal 11</Badge>
            <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 h-5">EN / BM</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {/* Hero */}
        <div className="mb-7">
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight mb-1">Content Types Reference</h1>
          <p className="text-slate-500 text-[14px] max-w-lg">Plain-language guide to all content types — what each field does, what to fill in, and what's required before publishing.</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-[#1a3a5c] text-white">{CONTENT_TYPES.length} Content Types</span>
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">{totalReq} Required Fields</span>
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">13 Taxonomy Vocabularies</span>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search content types, fields, keywords…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="flex-1 h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white rounded-lg"
            />
          </div>
          <div className="mt-3 overflow-x-auto">
            <Tabs value={activeGroup} onValueChange={setActiveGroup}>
              <TabsList className="h-8 bg-slate-100 inline-flex gap-0.5 p-1">
                <TabsTrigger value="all" className="text-[12px] h-6 px-3 rounded data-[state=active]:bg-white data-[state=active]:text-[#1a3a5c] data-[state=active]:font-semibold data-[state=active]:shadow-sm">All ({CONTENT_TYPES.length})</TabsTrigger>
                {GROUPS.map(g=>{
                  const count = CONTENT_TYPES.filter(ct=>ct.group===g).length
                  const short = g.replace(" & ","&").split(" ").slice(0,2).join(" ")
                  return <TabsTrigger key={g} value={g} className="text-[12px] h-6 px-3 rounded whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#1a3a5c] data-[state=active]:font-semibold data-[state=active]:shadow-sm">{short} ({count})</TabsTrigger>
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Results */}
        {Object.keys(grouped).length===0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-[14px]">No content types match your search.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([group,types])=>(
            <div key={group} className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{group}</h2>
                <div className="flex-1 h-px bg-slate-200"/>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{types.length} type{types.length>1?"s":""}</span>
              </div>
              <Accordion type="multiple">
                {types.map(ct=><CTCard key={ct.id} ct={ct}/>)}
              </Accordion>
            </div>
          ))
        )}

        {/* Taxonomy */}
        {showTaxonomy && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Taxonomy / Categories</h2>
              <div className="flex-1 h-px bg-slate-200"/>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex gap-2.5 p-3 rounded-lg border bg-amber-50 border-amber-200 text-[13px] text-amber-800 mb-4">
                <span>⚠️</span>
                <span><strong>Heads up:</strong> Adding or removing terms affects filters sitewide. Check with the dev team before deleting. To manage: <strong>Structure → Taxonomy</strong> in Drupal admin.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TAXONOMY.map(v=>(
                  <div key={v.machine} className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="font-semibold text-slate-800 text-[13px]">{v.name}</div>
                    <code className="text-[10px] text-slate-400 font-mono block mb-2">{v.machine}</code>
                    {v.terms && <div className="flex flex-wrap gap-1">{v.terms.map(t=><span key={t} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>)}</div>}
                    {v.note && <p className="text-[11.5px] text-slate-400 mt-1.5 italic">{v.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
