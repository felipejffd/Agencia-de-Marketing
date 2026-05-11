import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"

export interface BriefPDFProps {
  clientName: string
  projectName: string
  generatedAt: string
  interviewData: {
    businessDescription?: string
    targetAudience?: string
    mainGoal?: string
    creativeIdea?: string
    tone?: string
    competitors?: string
    additionalNotes?: string
  }
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FAF9F6",
    paddingVertical: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: "2px solid #0E0E0E",
    paddingBottom: 16,
    marginBottom: 28,
  },
  logo: {
    fontSize: 10,
    color: "#BD8130",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  projectName: {
    fontSize: 22,
    color: "#0E0E0E",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 13,
    color: "#4A4A4A",
    marginBottom: 2,
  },
  date: {
    fontSize: 9,
    color: "#8A8A8A",
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 8,
    color: "#BD8130",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1px solid #E5E4E0",
  },
  sectionBody: {
    fontSize: 10,
    color: "#0E0E0E",
    lineHeight: 1.6,
  },
  emptyValue: {
    fontSize: 10,
    color: "#AAAAAA",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    borderTop: "1px solid #E5E4E0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#8A8A8A",
  },
})

const SECTIONS = [
  { key: "businessDescription", title: "Descripción del negocio" },
  { key: "targetAudience", title: "Audiencia objetivo" },
  { key: "mainGoal", title: "Meta principal" },
  { key: "creativeIdea", title: "Idea creativa" },
  { key: "tone", title: "Tono de comunicación" },
  { key: "competitors", title: "Competidores" },
  { key: "additionalNotes", title: "Notas adicionales" },
] as const

export default function BriefPDF({
  clientName,
  projectName,
  generatedAt,
  interviewData,
}: BriefPDFProps) {
  return (
    <Document
      title={`Brief — ${projectName}`}
      author="JF Solutions"
      subject="Brief de Marketing"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>JF Solutions — Brief de Marketing</Text>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.date}>Generado el {generatedAt}</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map(({ key, title }) => {
          const value = interviewData[key]
          if (!value) return null
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={value ? styles.sectionBody : styles.emptyValue}>
                {value || "Sin información"}
              </Text>
            </View>
          )
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>JF Solutions Agency</Text>
          <Text style={styles.footerText}>{projectName}</Text>
        </View>
      </Page>
    </Document>
  )
}
