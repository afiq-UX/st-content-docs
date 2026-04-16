interface DetailViewProps {
    id: string
    onNavigate: (id: string | null) => void
  }
  
  export default function DetailView({ id, onNavigate }: DetailViewProps) {
    return <div>{id}</div>
  }